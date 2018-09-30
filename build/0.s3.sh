#!/usr/bin/env bash
# This script will create S3 buckets, set CORS config and tag bucket with client name
# Requires awscli

# Verify AWS CLI Credentials are setup
# http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html

if ! grep -q aws_access_key_id ~/.aws/config; then
  if ! grep -q aws_access_key_id ~/.aws/credentials; then
    echo "AWS config not found or CLI not installed. Please run \"aws configure\"."
    exit 1
  fi
fi

CLIENT="com.$COMPANY.$TEAM.serverless.$REGION"

function createbucket(){
	aws s3api create-bucket --bucket $CLIENT --region $REGION
}

function setcors(){
	aws s3api put-bucket-cors --bucket $CLIENT --cli-input-json \
	'{
		"CORSConfiguration": {
			"CORSRules": [
				{
					"AllowedOrigins": ["*"],
					"AllowedMethods": ["GET"],
					"MaxAgeSeconds": 3000,
					"AllowedHeaders": ["*"]
				}
			]
		}
	}'
}

function tag(){
	aws s3api put-bucket-tagging --bucket $CLIENT --tagging \
	'{
		"TagSet": [
			{
				"Key": "Client",
				"Value": "'$CLIENT'"
			}
		]
	}'
}

if [[ $(aws s3api list-buckets | grep $CLIENT) = *Name* ]]; then
  echo "Bucket $CLIENT already exists, emptying contents"
  aws s3 rm s3://$CLIENT --recursive
  exit 0
fi

echo "Creating Buckets, setting CORS Configuration, creating Tags..."
createbucket
setcors
tag
echo "Completed!"
