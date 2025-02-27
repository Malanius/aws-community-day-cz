import * as cdk from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { WebsiteCloudFront } from "./cloudfront";
import { WebsiteDns } from "./dns";
import { WebsiteDeployemnts } from "./deployments";

export interface WebsiteProps extends cdk.StackProps {
  domainName: string;
  hostedZoneId: string;
}

export class Website extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WebsiteProps) {
    super(scope, id, props);

    const { domainName, hostedZoneId } = props;

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "HostedZone",
      {
        hostedZoneId: hostedZoneId,
        zoneName: domainName,
      }
    );

    const websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true,
    });

    const cloudfront = new WebsiteCloudFront(this, "WebsiteCloudFront", {
      websiteBucket,
      hostedZone,
    });

    new WebsiteDeployemnts(this, "WebsiteDeployments", {
      websiteBucket,
      distribution: cloudfront.distribution,
    });

    new WebsiteDns(this, "WebsiteDns", {
      hostedZone,
      distribution: cloudfront.distribution,
    });
  }
}
