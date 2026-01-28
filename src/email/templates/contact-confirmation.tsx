import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Heading,
  Link,
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';

interface ContactConfirmationProps {
  name: string;
}

export const ContactConfirmation = ({ name }: ContactConfirmationProps) => {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-gray-100">
          <Container className="mx-auto bg-white p-8 max-w-2xl">
            <Heading className="text-2xl text-center text-blue-600 mb-6">
              We've Received Your Message!
            </Heading>

            <Text className="text-lg text-gray-800 mb-4">Hi {name},</Text>

            <Text className="text-gray-700 mb-4">
              Thank you for reaching out to us. We've received your message and
              our team will get back to you as soon as possible.
            </Text>

            <Text className="text-gray-700 mb-4">
              We typically respond within 24-48 hours during business days.
            </Text>

            <Text className="text-gray-700 mb-4 font-semibold">
              In the meantime, stay connected with us:
            </Text>

            <Text className="text-gray-700 mb-2">
              Instagram:{' '}
              <Link
                href="https://www.instagram.com/teamstorytimehq/"
                className="text-blue-600 underline"
              >
                @teamstorytimehq
              </Link>
            </Text>

            <Text className="text-gray-700 mb-2">
              Facebook:{' '}
              <Link
                href="https://www.facebook.com/profile.php?id=61585584201713"
                className="text-blue-600 underline"
              >
                @StoryTimeHQ
              </Link>
            </Text>

            <Text className="text-gray-700 mb-2">
              Twitter/X:{' '}
              <Link
                href="https://x.com/storytimehq"
                className="text-blue-600 underline"
              >
                @storytimehq
              </Link>
            </Text>

            <Text className="text-gray-800 mt-6">
              Warmly,
              <br />
              The StoryTime Team
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
