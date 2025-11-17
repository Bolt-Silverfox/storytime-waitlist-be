import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Heading,
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
              🎉 Welcome to StoryTime!
            </Heading>

            <Text className="text-lg text-gray-800 mb-4">Hi {username},</Text>

            <Text className="text-gray-700 mb-4">
              Thank you for joining our waitlist! We're excited to have you as
              part of the StoryTime community.
            </Text>

            <Text className="text-gray-700 mb-4">
              You're now among the first to know when we launch our interactive
              storytelling platform for kids. We'll keep you updated on our
              progress and let you know as soon as you can start creating
              magical stories with your children.
            </Text>

            <Text className="text-gray-700 mb-6">
              In the meantime, feel free to share StoryTime with other parents
              and educators who might be interested!
            </Text>

            <Text className="text-gray-800">
              Best regards,
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
