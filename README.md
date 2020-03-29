# Serverless Image Processor

## Introduction

This repository contains a simple Serverless application that can be deployed to AWS and run as a Lambda function.

The AWS resources created include:

- A S3 bucket for uploading images
- A Lambda function to processing image files
- A S3 bucket for storing the processed images

The Lamda function is invoked whenever an image (or any object) is added to the upload S3 bucket. This image is processed and stored in the processed images S3 bucket.

The image processing Lambda function re-sizes the uploaded image to 100 x 100 pixels and saves it in JPEG format.

## 3rd Party Libraries

This application uses:

- Serverless to test, deploy and remove AWS resources. More details can be found in the [Serverless documentation](https://serverless.com/framework/docs/).
- Sharp for image processing. More details can be found in the [Sharp documentation](https://sharp.pixelplumbing.com/).


## Windows

AWS deployments are simplified when the code is built and deployed from Unix/Linux.

For Windows users, it is recommend that you build and deploy using the Windows Subsystem for Linux (WSL) where possible.

**NOTE:** At the time of writing, a permissions bug has been noticed when trying to run `npm install` or `serverless deploy` commands within WSL while Visual Studio Code is open with the source code. This has also been reported on forums by others. Sadly, the only solution that worked for me was to close Visual Studio Code before running these commands.

## Installing

To install, from the command line type:
```
npm install
```

**Note:** AWS expects Linux binaries. If you are installing from a non-Linux OS such as a Windows or MacOs, use:
```
npm install --arch=x64 --platform=linux
```

Once installed, ensure you have the Serverless CLI available and have your AWS credentials configured. Follow the instructions in the [Serverless installation guide](https://serverless.com/framework/docs/providers/aws/guide/installation/).

## Testing Locally

To test the function locally, run the command:
```
serverless invoke local -f imageTransform -p tests/event.json
```

- `ImageTransform` : is the name of the image processing function.
- `test/events.json` : is the path to a file containing a sample JSON event.

It is likely that the test will throw a *'specified bucket does not exist'* error. The test assumes that the upload and processed images S3 buckets already exist (and the upload bucket contains the image requiring processing). However, this test is still useful as it confirms everything has been installed successfully before attempting to deploy.

## Deploying the Serverless Application

To deploy to AWS, run the command:
```
serverless deploy
```

This will deploy to AWS using CloudFormation.

Once deployed, review the CloudFormation stack and resources using the AWS console.

## Invoking the Function

As described earlier, the image processing function will be invoked every time a new image is uploaded to the uploaded images bucket.

A processed version of the file will be stored in the processed images bucket.

It is recommended to review performance and logs of the Lambda function in the AWS console's Lambda function monitoring tab.

## Removing the Serverless Application

To remove (undeploy) the application from AWS, run the command
```
serverless remove
```

All previously created resources, will be destroyed. Any images stored in the buckets will also be lost.

## Code Structure

This application has been written in Javascript for a NodeJS runtime.

The important files to maintain are:

- `serverless.yml` : the configuration and resources needed to create the serverless application.
- `handler.ts` : the image processing function triggererd by an upload event.


## Manual Testing and Deployment

For ease of use, it is **highly** recommended to allow Serverless to manage the testing and deployment of the application (as described above).

The section below, explains how to test and deploy your Lamda function if you prefer a more manual method. You will need to create all the buckets and set-up any neccessary permissions yourself.

**NOTE:** Some of the below changes work simply when working in Javascript. They may require some tweaking for Typescript.

### Manual Testing

To manually test a Lambda function, you can modify `package.json` as follows:

Add the following to `devDependencies`:
```
"run-local-lambda": "^1.1.1"
```

This provides a module to test Lambdas locally.

Add the following to `scripts`:
```
"test": "run-local-lambda --file handler.js --event tests/event.json"
```

You can now test your function by running:

```
npm test
```

This is same test we ran with Serverless. This may fail as before if the expected buckets and images do not exist in AWS.

### Manual Deployment

To manually deploy a Lambda function, the code must be zipped and then sent to the AWS Lambda function. This assumes the Lambda function already exists and we are deploying an update.

Modify the `package.json` as follows:

Add the following to `scripts`:
```
"predeploy": "zip -r image-resize.zip * -x *.zip *.json *.log",
"deploy": "aws lambda update-function-code --function-name arn:aws:lambda:<aws-region>:<account>:function:<lambda-name> --zip-file fileb://image-resize.zip"
```

As can be seen, the ARN of the Lambda function must be known to allow this deploy script to work.

You can now deploy your function by running:

```
npm deploy
```

This will cause the `predeploy` script to run first (to zip-up the application). The `deploy` script will then run, which pushes the zipped application to the AWS Lambda function.
