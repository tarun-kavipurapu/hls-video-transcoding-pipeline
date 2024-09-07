import {
  SQSClient,
  ReceiveMessageCommand,
  ReceiveMessageCommandOutput,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import {
  AssignPublicIp,
  ECSClient,
  LaunchType,
  RunTaskCommand,
} from "@aws-sdk/client-ecs";

const sqsClient = new SQSClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: "",
    secretAccessKey: "",
  },
});
const ecsClient = new ECSClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: "",
    secretAccessKey: "",
  },
});
const queueUrl =
  "https://sqs.us-east-1.amazonaws.com/725523420264/transcode-queue";

async function init() {
  const params = {
    QueueUrl: queueUrl,
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 10,
  };

  const command: ReceiveMessageCommand = new ReceiveMessageCommand(params);

  while (true) {
    try {
      console.log("Polling ...");
      const { Messages }: ReceiveMessageCommandOutput = await sqsClient.send(
        command
      );

      if (!Messages) {
        console.log(`No message in Queue`);
        continue;
      }

      for (const message of Messages) {
        try {
          const { MessageId, Body } = message;
          if (!Body) {
            console.log("Received message with empty body, skipping");
            continue;
          }

          const event = JSON.parse(Body);
          if ("Service" in event && "Event" in event) {
            if (event.Event === "s3:TestEvent") {
              console.log("Ignoring test event");
              continue;
            }
          }
          console.log(`Message Received`, { MessageId, Body });

          for (const record of event.Records) {
            const { s3 } = record;

            const {
              bucket,
              object: { key },
            } = s3;

            const input = {
              cluster: "arn:aws:ecs:us-east-1:725523420264:cluster/hls-dev",
              taskDefinition:
                "arn:aws:ecs:us-east-1:725523420264:task-definition/video-transcoder:1",
              launchType: "FARGATE" as LaunchType | undefined,
              networkConfiguration: {
                awsvpcConfiguration: {
                  assignPublicIp: "ENABLED" as AssignPublicIp | undefined,
                  securityGroups: ["sg-011b08bbbf713a0fa"],
                  subnets: [
                    "subnet-09e8e921492d48851",
                    "subnet-0784c4ce41f752a86",
                    "subnet-01f51a732a9243bbb",
                  ],
                },
              },
              overrides: {
                containerOverrides: [
                  {
                    name: "video-transcoder",
                    environment: [
                      { name: "BUCKET_NAME", value: bucket.name },
                      { name: "KEY", value: key },
                    ],
                  },
                ],
              },
            };

            const runTaskCommand = new RunTaskCommand(input);

            try {
              await ecsClient.send(runTaskCommand);
              console.log(`ECS task launched for ${bucket.name}/${key}`);
            } catch (error) {
              console.error(
                `Failed to launch ECS task for ${bucket.name}/${key}:`,
                error
              );
              // Optionally, we might want to implement a retry mechanism here
              continue;
            }
          }

          try {
            await sqsClient.send(
              new DeleteMessageCommand({
                QueueUrl: queueUrl,
                ReceiptHandle: message.ReceiptHandle,
              })
            );
            console.log(`Message ${MessageId} deleted from queue`);
          } catch (error) {
            console.error(
              `Failed to delete message ${MessageId} from queue:`,
              error
            );
            // Optionally, implement retry logic for message deletion
          }
        } catch (messageError) {
          console.error("Error processing message:", messageError);
          // Log the problematic message for further investigation
          console.error("Problematic message:", message);
        }
      }
    } catch (pollingError) {
      console.error("Error during polling:", pollingError);
      // Implement a delay before retrying to avoid hammering the service
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

init().catch((error) => {
  console.error("Fatal error in init function:", error);
  process.exit(1);
});
