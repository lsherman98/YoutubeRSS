import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Rss, Youtube, Zap, CheckCircle2, ArrowRight, Code2, Terminal, Webhook, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { pb } from "@/lib/pocketbase";
import { PricingToggle } from "@/components/subscription/pricing-toggle";
import { PricingPlans } from "@/components/subscription/pricing-plans";

export const Route = createFileRoute("/landing/")({
  component: LandingPage,
});

function LandingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const isLoggedIn = pb.authStore.isValid;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <header className="bg-white dark:bg-gray-900 py-4 border-b dark:border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link to="/landing" className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
            YouTube RSS
          </Link>
          <div className="flex gap-2 md:gap-4">
            {isLoggedIn ? (
              <Link to="/podcasts">
                <Button variant="outline" size="sm" className="md:h-10">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/signin">
                <Button variant="outline" size="sm" className="md:h-10">
                  Log In
                </Button>
              </Link>
            )}
            <Button variant="secondary" size="sm" className="md:h-10">
              Documentation
            </Button>
          </div>
        </div>
      </header>
      <section className="container mx-auto px-4 pt-12 md:pt-20 pb-12 md:pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-2 md:p-3 mb-4 md:mb-6 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950">
            <Rss className="h-6 w-6 md:h-8 md:w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
            Turn YouTube Videos into Your Personal Podcast
          </h1>
          <p className="text-base md:text-xl text-gray-600 dark:text-gray-300 mb-6 md:mb-8 max-w-2xl mx-auto px-4">
            Convert any YouTube video into podcast episodes. Listen anywhere with your favorite podcast app.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Link to="/signin" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-5 md:py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          <FeatureCard
            icon={<Youtube className="h-8 w-8" />}
            title="YouTube to Podcast"
            description="Paste in any YouTube video URL and instantly convert it to a podcast episode."
          />
          <FeatureCard
            icon={<Rss className="h-8 w-8" />}
            title="RSS Feed Generation"
            description="Get a standard RSS feed URL that works with any podcast app like Apple Podcasts, Spotify, and more."
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8" />}
            title="Audio File Uploads"
            description="Upload your own audio files alongside YouTube videos to your podcast feed."
          />
          <FeatureCard
            icon={<Terminal className="h-8 w-8" />}
            title="CLI Tool"
            description="Add Youtube videos to your podcast feed directly from the command line."
          />
          <FeatureCard
            icon={<Code2 className="h-8 w-8" />}
            title="Developer API"
            description="Programmatically convert and download YouTube videos using our API."
          />
          <FeatureCard
            icon={<Webhook className="h-8 w-8" />}
            title="Webhook Notifications"
            description="Get real-time updates when conversions complete. Integrate with your existing systems seamlessly."
          />
        </div>
      </section>
      <section className="container mx-auto px-4 py-12 md:py-16 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl md:rounded-3xl my-12 md:my-16">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 md:mb-12 px-4">How It Works</h2>
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          <StepCard
            number={1}
            title="Create Your Podcast"
            description="Sign up and create a new podcast feed with your custom title, description, and artwork."
          />
          <StepCard
            number={2}
            title="Add YouTube Videos"
            description="Paste in YouTube video URLs via the web dashboard, or CLI."
          />
          <StepCard
            number={3}
            title="Get Your RSS Feed"
            description="Receive a standard RSS feed URL that you can use with your podcast app of choice."
          />
          <StepCard
            number={4}
            title="Subscribe & Listen"
            description="Subscribe to your podcast on Apple Podcasts, Spotify, YouTube Music, or any other podcast platform."
          />
        </div>
      </section>
      <section className="container mx-auto px-4 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 md:mb-12 px-4">
          Built for Developers
        </h2>
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
          <Card className="border-2 flex flex-col">
            <CardContent className="p-6 md:p-8 flex-1 flex flex-col">
              <div className="flex items-start gap-3 md:gap-4 mb-4">
                <div className="p-2 md:p-3 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 flex-shrink-0">
                  <Code2 className="h-6 w-6 md:h-8 md:w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-semibold mb-2">API</h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-4">
                    Integrate YouTube to audio conversion directly into your applications with our powerful API.
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-xs md:text-sm flex-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Simple endpoints designed to get you started quickly</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Batch processing up to 50 URLs at once</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Job polling for conversion status</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Direct download links for converted audio</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Webhook notifications for asynchronous workflows</span>
                </li>
              </ul>
              <Button variant="outline" className="mt-6 w-full text-sm md:text-base" disabled>
                API Docs (Coming Soon)
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
          <Card className="border-2 flex flex-col">
            <CardContent className="p-6 md:p-8 flex-1 flex flex-col">
              <div className="flex items-start gap-3 md:gap-4 mb-4">
                <div className="p-2 md:p-3 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 flex-shrink-0">
                  <Terminal className="h-6 w-6 md:h-8 md:w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-semibold mb-2">CLI</h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-4">
                    Use the command line to easily add YouTube videos to your podcast feeds.
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-xs md:text-sm flex-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Quickly add to your podcasts without opening a browser</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Available for Mac, Windows, and Linux</span>
                </li>
              </ul>
              <div className="mt-6 space-y-3">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-3 font-mono text-xs md:text-sm">
                  brew install lsherman/ytrss/ytrss
                </div>
                <Button variant="outline" className="w-full text-sm md:text-base" disabled>
                  CLI Docs (Coming Soon)
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 px-4">Simple, Transparent Pricing</h2>
          <p className="text-base md:text-xl text-gray-600 dark:text-gray-300 mb-4 px-4">
            Start free, upgrade when you need more
          </p>
          <PricingToggle isYearly={isYearly} onToggle={setIsYearly} />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs md:text-sm text-gray-500 dark:text-gray-400 px-4 mt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>No credit card required</span>
            </div>
            <span className="hidden sm:inline mx-2">•</span>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Free tier always free</span>
            </div>
          </div>
        </div>
        <PricingPlans isYearly={isYearly} showActions={false} />
        <div className="text-center mt-8 md:mt-12 max-w-2xl mx-auto">
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 md:p-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-600 flex-shrink-0" />
              <span className="text-sm md:text-base font-semibold text-green-800 dark:text-green-400">
                100% Free to Start
              </span>
            </div>
            <p className="text-xs md:text-sm text-green-700 dark:text-green-300">
              No credit card required. Start with our free tier and upgrade only when you need more capacity. Cancel
              anytime with no questions asked.
            </p>
          </div>
        </div>
      </section>
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl md:rounded-3xl p-8 md:p-12 text-white">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">Ready to Get Started?</h2>
          <p className="text-base md:text-lg mb-6 md:mb-8 opacity-90">
            Create your first podcast feed in minutes. No credit card required.
          </p>
          <Link to="/signin" className="block sm:inline-block">
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-5 md:py-6"
            >
              Start Converting Now
              <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="border-2 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
      <CardContent className="p-4 md:p-6">
        <div className="inline-flex items-center justify-center p-2 md:p-3 mb-3 md:mb-4 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 text-blue-600 dark:text-blue-400">
          {icon}
        </div>
        <h3 className="text-lg md:text-xl font-semibold mb-2">{title}</h3>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">{description}</p>
      </CardContent>
    </Card>
  );
}

interface StepCardProps {
  number: number;
  title: string;
  description: string;
}

function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="flex gap-4 md:gap-6 items-start">
      <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center text-lg md:text-xl font-bold">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="text-lg md:text-xl font-semibold mb-2">{title}</h3>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">{description}</p>
      </div>
    </div>
  );
}
