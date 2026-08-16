import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface MagicLinkEmailProps {
  actionUrl: string;
  firstName: string;
  mailType: "login" | "register";
  siteName: string;
}

export const MagicLinkEmail = ({
  firstName = "",
  actionUrl,
  mailType,
  siteName,
}: MagicLinkEmailProps) => (
  <Html lang="zh-CN">
    <Head />
    <Preview>
      {mailType === "login"
        ? `点击安全登录 ${siteName}`
        : `激活您的 ${siteName} 账户`}
    </Preview>
    <Body style={styles.body}>
      <Container style={styles.container}>
        <Text style={styles.title}>{siteName}</Text>
        <Text style={styles.text}>
          您好{firstName ? `，${firstName}` : ""}：
        </Text>
        <Text style={styles.text}>
          {mailType === "login"
            ? `我们收到了登录 ${siteName} 的请求。请点击下方按钮完成登录。`
            : `欢迎使用 ${siteName}！请点击下方按钮激活您的账户。`}
        </Text>
        <Section style={styles.buttonSection}>
          <Button style={styles.button} href={actionUrl}>
            {mailType === "login" ? `登录 ${siteName}` : "激活账户"}
          </Button>
        </Section>
        <Text style={styles.text}>
          此链接将在 5 分钟后失效，并且只能使用一次。
        </Text>
        <Text style={styles.text}>
          如果按钮无法打开，请复制以下链接到浏览器：
        </Text>
        <Text style={styles.linkText}>
          <Link href={actionUrl} style={styles.link}>
            {actionUrl}
          </Link>
        </Text>
        <Text style={styles.text}>
          如果这不是您本人发起的请求，请忽略此邮件。请勿将本邮件或登录链接转发给他人。
        </Text>
        <Hr style={styles.hr} />
        <Text style={styles.footer}>此邮件由 {siteName} 自动发送。</Text>
      </Container>
    </Body>
  </Html>
);

const styles = {
  body: {
    backgroundColor: "#ffffff",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
  },
  container: {
    margin: "0 auto",
    padding: "20px 0 48px",
    maxWidth: "560px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold" as const,
    textAlign: "center" as const,
    margin: "0 0 20px",
  },
  text: {
    fontSize: "16px",
    lineHeight: "26px",
    color: "#333333",
  },
  linkText: {
    fontSize: "13px",
    lineHeight: "20px",
    overflowWrap: "anywhere" as const,
  },
  link: {
    color: "#2563eb",
  },
  buttonSection: {
    textAlign: "center" as const,
    margin: "32px 0",
  },
  button: {
    backgroundColor: "#18181b",
    borderRadius: "6px",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "bold" as const,
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "12px 24px",
  },
  hr: {
    borderColor: "#e5e5e5",
    margin: "20px 0",
  },
  footer: {
    fontSize: "12px",
    color: "#666666",
    textAlign: "center" as const,
  },
};

export default MagicLinkEmail;
