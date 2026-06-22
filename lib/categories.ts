/**
 * SAA-C03 taxonomy — the single source of truth for domains and topics,
 * shared by the category picker, insights dashboard, and question filtering.
 * Mirrors the values populated into questions.domain / questions.topic.
 */

export const DOMAINS = [
  { value: "secure", label: "Secure", full: "Design Secure Architectures" },
  { value: "resilient", label: "Resilient", full: "Design Resilient Architectures" },
  { value: "performant", label: "Performant", full: "Design High-Performing Architectures" },
  { value: "cost", label: "Cost-Optimized", full: "Design Cost-Optimized Architectures" },
] as const;

export type DomainValue = (typeof DOMAINS)[number]["value"];

export const DOMAIN_VALUES: DomainValue[] = DOMAINS.map((d) => d.value);

export const DOMAIN_LABELS: Record<DomainValue, string> = Object.fromEntries(
  DOMAINS.map((d) => [d.value, d.label]),
) as Record<DomainValue, string>;

export const TOPICS = [
  "VPC/Networking",
  "EC2/Compute",
  "Containers (ECS/EKS/Fargate)",
  "Storage (S3/EBS/EFS/FSx)",
  "Databases (RDS/Aurora/DynamoDB)",
  "IAM",
  "Security & Compliance",
  "Lambda & Serverless",
  "API Gateway",
  "Monitoring (CloudWatch/CloudTrail)",
  "Disaster Recovery & Backup",
  "Migration & Transfer",
  "Cost & Billing",
  "Well-Architected",
  "Auto Scaling & ELB",
  "Route 53 & CloudFront",
  "Messaging (SQS/SNS/Kinesis)",
  "KMS & Encryption",
  "Organizations & Control Tower",
  "Other",
] as const;

export type Topic = (typeof TOPICS)[number];

export const TOTAL_QUESTIONS = 312;
