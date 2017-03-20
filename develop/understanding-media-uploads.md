---
layout: page
title: Understanding Media Uploads
tagline: Get Started with Media Uploads Using Materia
class: admin
---
{% include JB/setup %}

# Quick Start #

By default Materia stores all uploaded media in the local file system
associated with the web server. The thumbnails for these images are also
generated locally. Storing dynamic assets and generating their thumbnails
locally is okay for a small user base. However, for a larger user base check
out the the advanced options for dynamic asset storage that Materia supports.

# Adding Scaleability #

Materia supports alternative ways to process and store media uploads. These
advanced options are in place to assist with scaleability when dealing with
a large body of users.

## Uploading Media to Amazon S3

Outsourcing Media to Amazon S3 will keep dynamic assets in a central location,
which will ultimately allow multiple machines to be spun up as needed to
support a large user base. Keeping dynamic assets local to the web server will
cause disruption when load balancing users to different machines because the
dynamic assets will be spread among these machines with no consistency.    

[Learn More About Amazon S3](https://aws.amazon.com/s3/)

### An Overview of the Upload Process

Uploading Media to Amazon S3 is a five step process:

1. The user client requests temporary upload keys from the Materia server
in order to upload an asset to Amazon S3

2. The Materia Server responds with temporary upload keys and stores the upload
information in the *asset* table of the *materia* database.

3. The client then sends a requests to Amazon S3, using the temporary upload
keys, to store the asset.

4. Upon successful upload, Amazon S3 returns a success message and the image is
stored.

5. A thumbnail for the asset is rendered using Amazon's Lambda service and
stored.

<!-- **Disclaimer: Given the preceding workflow, anybody with the unique image url
generated from the upload process can access that image. This includes people
outside of Materia. The image IDs are generated using a hash of image
properties, which makes it harder to randomly come across these image urls.** -->

### User Asset File Structure Inside a Bucket

Materia will support the three following situations in regards to the file
structure within an S3 bucket. Remember that Materia is expecting thumbnail
resizing to be done by a lambda function using Amazon's Lambda service, so
the lambda function should adhere to one of the following file structures.

#### Scenario 1 - Storing in the Root (Not Encouraged)

If Materia App's `subdir` s3 configuration variable is not set, uploads will be
stored in the root of the bucket. This is strongly discouraged because the
bucket may become very unorganized in this situation.

```
# Using a single bucket:
s3_bucket
  |-- thumbnails
  # original user uploads are held in the root of bucket

# Using two buckets:
s3_bucket_1
  # original user uploads are held in the root of bucket
s3_bucket_2
  |-- thumbnails # holds assets resized by lambda service
```

#### Scenario 2 - Using a Sub-directory and a Single Bucket

When using a single bucket for original assets and thumbnails, all original
assets will be stored in directory specified by the `subdir` s3 configuration
variable. Thumbnails will go to the thumbnails directory.

```
s3_bucket
  |-- subdir # holds original copies of user uploads
  |-- thumbnails # holds assets resized by lambda service
```

#### Scenario 2 - Using a Sub-directory and Two Buckets (Strongly Encouraged)

When using a single bucket for original assets and thumbnails, all original
assets will be stored in directory specified by the `subdir` s3 configuration
variable. Thumbnails will go to the thumbnails directory.

```
s3_bucket_1
  |-- subdir # holds original copies of user uploads
s3_bucket_2
  |-- thumbnails # holds assets resized by lambda service
```

### Configuration Variables

|Variable|Type|Description|
|--|
|`s3_enabled`|boolean|Turns S3 upload feature on and off|
|`upload_url`|string|Defines the S3 endpoint to be uploaded to
|`bucket`|string|Defines the specific S3 bucket an asset should be stored in
|`subdir`|string|Defines a directory to store the user uploaded assets to in the specified S3 bucket
|`secret_key`|string|API key to access Amazon S3
|`AWSAccessKeyId`|string|Access Key Id assigned by Amazon S3
|`expire_in`|int|Sets the expiration time of temporary upload keys|

### Using Amazon S3

To enable the use of an Amazon S3 bucket, go to
`fuel/app/config/development/materia.php`, and edit the *s3 config* as follows:

1. Set `s3_enabled` to `true`
2. Set the `upload_url` to `aws.amazon.com`
3. Set the `bucket` to the name of the desired Amazon S3 bucket to be uplaoded to
4. See the [file structure section](#user-asset-file-structure-inside-a-bucket) to learn more about the  `subdir` configuration variable
5. Set the `secret_key` and `AWSAccessKeyId` to their respective values assigned
   by Amazon
6. Set `expire_in` to the desired expiration time (in seconds) of the temporary
   upload token. Once a token is expired AWS will no longer accept it.

### Using up Fakes3

Amazon S3 is emulated using a ruby gem called Fakes3 within a
separate ruby docker container. This container is setup during the
`./firstrun.sh` of Materia.

To enable the use of this Fakes3 container, go to
`fuel/app/config/development/materia.php`, and edit the *s3_config* as follows:

 1. Set `s3_enabled` to `true`
 2. Set `upload_url` to the IP adress of the docker machine at port `10001`
 3. Set `bucket` to `fakes3`
 4. `subdir` will be set to `dev_uploads` automatically when `FUEL_ENV` is not set to `PRODUCTION`
 5. Since Fakes3 does not implement an authentication layer, the following variables can be left as is:
  * `secret_key`
  * `AWSAccessKeyId`
  * `expire_in`

The thumbnails for these images will be stored in the `thumbnails` directory within the fakes3 bucket.

## Generating Media Thumbnails with Amazon Lambda

A web server should not be burdened with generating media thumbnails. When a
large amount of users begin to upload media, the server will become overloaded
with these requests and it will not be able serve pages to other users
efficiently. In cases where many users are attempting to upload images, the
server may crash.  

[Learn More About Amazon Lambda](https://aws.amazon.com/lambda/)

### An Overview of Generating Thumbnails

Amazon Lambda has no interaction with Materia at all. This is what makes Lambda
a great option for tasks such as creating thumbnails. Lambda is able to
communicate to Amazon S3 directly. To see how Lambda communicates with S3, visit
the learn more link mentioned in the above section.

### Setting Up Amazon Lambda for Production

Setting up a lambda function for Amazon Lambda function can be broken down into
one question: **Should user assets and resized images be stored in the same bucket, or two
separate buckets?**

This is important, because Materia will act differently depending on the S3
bucket file structure defined in the S3 configuration of Materia.

Materia's local lambda setup uses two separate buckets. The local lambda script
is the exact script that is used in production, and the script can be directly
copied over to the directory being deployed to Amazon's Lambda service.

### Setting Up Lambda Local for Development

Similar to Fakes3, Lambda Local is automatically set up during `./firstrun.sh`.
Unlike production, this is mandatory to use in development when using fakes3.
No set up is required, if Fakes3 is enabled, Lambda Local will also be enabled.
