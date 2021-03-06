'use strict';

const aws = require('aws-sdk');
const sharp = require('sharp');

const s3 = new aws.S3({
  signatureVersion: 'v4',
});
const format = 'jpg';
const OUT_BUCKET = process.env.PROCESSED_BUCKET;

const getImageFromBucket = async (bucket, key) =>
    s3
        .getObject({
            Bucket: bucket,
            Key: key
        })
        .promise();

const processImage = async (file, format) =>
  sharp(file)
        .resize({
            width: 100,
            height: 100,
            fit: 'fill'
        })
        .toFormat(format)
        .toBuffer();

const writeImageToBucket = async (bucket, key, format, image) =>
    s3
        .putObject({
            Body: image,
            Bucket: bucket,
            ContentType: `image/${format}`,
            CacheControl: 'max-age=3153600',
            Key: `${key}.${format}`,
            StorageClass: 'STANDARD',
            ACL: 'public-read'
        })
        .promise();

module.exports.imageTransform = async (event, context, callback) => {
  
  // retrieve bucket details - we only expect 1 record
  const s3RecordEvent = event.Records[0];
  console.log(`Received Event:\n${JSON.stringify(s3RecordEvent, null, 2)}`);
  const inputBucket = s3RecordEvent.s3.bucket.name;
  const key = s3RecordEvent.s3.object.key;

  // replace any input file spaces with '+'
  const sourceKey = decodeURIComponent(key.replace(/\+/g, ' '));

  // remove the extension
  const outputKey = sourceKey.split('.')[0];
  
  try {
      console.log(`Getting image: '${key}' from bucket: '${inputBucket}'...`);
      const originalImageFile = await getImageFromBucket(inputBucket, key);
      
      console.log(`Processing image of type '${originalImageFile.ContentType}'...`);
      const objectBuffer = originalImageFile.Body; // as Buffer;
      const processedImageBuffer = await processImage(objectBuffer, format);
  
      console.log(`Writing image: '${outputKey}.${format}' to bucket: '${OUT_BUCKET}'...`);
      const result = await writeImageToBucket(OUT_BUCKET, outputKey, format, processedImageBuffer);

      console.log(`Successfully completed with tag ${result.ETag}`);
      callback(null, `{ message: 'SUCCESS', tag: ${result.ETag},  event }`);
  } catch(err) {
    if(typeof err === 'object' && err.hasOwnProperty('message')) {
      console.log(`Exception '${err.message}' while attempting to resize image file.`);
      callback(err);
    }
    else {
      console.log(`Exception while attempting to resize image file:\n${err}`);
      callback(Error(err));
    }
  };
};
