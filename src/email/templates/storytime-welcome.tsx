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

interface StorytimeWelcomeProps {
  username: string;
  email: string;
}

export const StorytimeWelcome = ({
  username,
  email,
}: StorytimeWelcomeProps) => {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-gray-100">
          <Container className="mx-auto bg-white p-8 max-w-2xl">
            <Heading className="text-2xl text-center text-blue-600 mb-6">
              Welcome to StoryTime!
            </Heading>

            <Text className="text-lg text-gray-800 mb-4">Hi {username},</Text>

            <Text className="text-gray-700 mb-4">
              Welcome to StoryTime, and thanks for joining our waitlist.
            </Text>

            <Text className="text-gray-700 mb-4">
              We're designing a storytelling experience where every story feels
              personal—crafted to support your child's curiosity, learning, and
              imagination.
            </Text>

            <Text className="text-gray-700 mb-4">
              As a waitlist member, you'll get early access, launch updates, and
              first looks at what we're creating.
            </Text>

            <Text className="text-gray-700 mb-6">
              Feel free to share StoryTime with parents or educators who believe
              in the power of stories too.
            </Text>

            <Text className="text-gray-700 mb-4 font-semibold">
              Stay connected with us:
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
              LinkedIn:{' '}
              <Link
                href="https://www.linkedin.com/company/storytimehq/"
                className="text-blue-600 underline"
              >
                @storytimehq
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

            <Text className="text-gray-700 mb-6">
              TikTok:{' '}
              <Link
                href="https://www.tiktok.com/@teamstorytimehq"
                className="text-blue-600 underline"
              >
                @teamstorytimehq
              </Link>
            </Text>

            <Text className="text-gray-800 mt-6">
              Warmly,
              <br />
              The StoryTime Team
            </Text>

            <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500 text-center">
              <Text>
                This email was sent to {email} because you signed up for our
                waitlist.
              </Text>
              <Text>
                If you no longer wish to receive updates, you can unsubscribe at
                any time.
              </Text>
            </div>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
