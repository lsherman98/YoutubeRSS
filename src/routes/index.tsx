import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Rss,
  Youtube,
  Zap,
  CheckCircle2,
  ArrowRight,
  Code2,
  Terminal,
  Webhook,
  ExternalLink,
  Mic,
  Wifi,
  Key,
  Database,
  Infinity,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <header className="bg-white dark:bg-gray-900 py-4 border-b dark:border-gray-800">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            YouTube RSS
          </Link>
          <div className="space-x-4">
            <Link to="/signin">
              <Button variant="outline">Log In</Button>
            </Link>
            <Button variant="secondary">Documentation</Button>
          </div>
        </div>
      </header>
      <section className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-3 mb-6 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950">
            <Rss className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Turn YouTube Videos into Your Personal Podcast
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Convert any YouTube video into podcast episodes. Listen anywhere with your favorite podcast app.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signin">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
      <section className="container mx-auto px-4 py-16 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-3xl my-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How It Works</h2>
        <div className="max-w-4xl mx-auto space-y-8">
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
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Built for Developers</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Card className="border-2 flex flex-col">
            <CardContent className="p-8 flex-1 flex flex-col">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950">
                  <Code2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">API</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Integrate YouTube to audio conversion directly into your applications with our powerful API.
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm flex-1">
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
              <Button variant="outline" className="mt-6 w-full">
                API Docs
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
          <Card className="border-2 flex flex-col">
            <CardContent className="p-8 flex-1 flex flex-col">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950">
                  <Terminal className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">CLI</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Use the command line to easily add YouTube videos to your podcast feeds.
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm flex-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Quickly add to your podcasts without opening a browser</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Available for Mac, Windows, and Linux</span>
                </li>
              </ul>
              <Button variant="outline" className="mt-6 w-full">
                CLI Docs
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">Start free, upgrade when you need more</p>
          <div className="flex items-center gap-2 justify-center mb-6">
            <span className={`text-sm ${!isYearly ? "font-bold" : ""}`}>Monthly</span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <span className={`text-sm ${isYearly ? "font-bold" : ""}`}>
              Yearly <span className="text-green-600">(Save 15%)</span>
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>No credit card required</span>
            <span className="mx-2">•</span>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Free tier always free</span>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          <Card className="relative flex flex-col h-full border-2">
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mic className="h-5 w-5 text-gray-600" />
                  <h3 className="text-xl font-semibold">Free</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">Everything you need to get started</p>
                <div className="mb-4 min-h-[4.5rem]">
                  <div className="text-3xl font-bold">$0</div>
                  <div className="text-sm text-gray-500">forever</div>
                  <div className="text-xs text-gray-500 h-4"></div>
                </div>
              </div>
              <ul className="space-y-3 flex-1">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">15 uploads</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">500MB per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">1 podcast</span>
                </li>
                <li className="flex items-center gap-2 opacity-50">
                  <span className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">No API access</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          <Card className="relative flex flex-col h-full border-2">
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wifi className="h-5 w-5 text-blue-500" />
                  <h3 className="text-xl font-semibold">Basic</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">Usage limits that work for you</p>
                <div className="mb-4 min-h-[4.5rem]">
                  <div className="text-3xl font-bold">{isYearly ? "$10.20" : "$12"}</div>
                  <div className="text-sm text-gray-500">{isYearly ? "per month" : "per month"}</div>
                  <div className="text-xs text-gray-500 h-4">{isYearly ? "Billed $122/year" : ""}</div>
                </div>
              </div>
              <ul className="space-y-3 flex-1">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">50 uploads</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">2GB per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Unlimited podcasts</span>
                </li>
                <li className="flex items-center gap-2 opacity-50">
                  <span className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">No API access</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          <Card className="relative flex flex-col h-full border-2 border-blue-500">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-blue-600 text-white">Most Popular</Badge>
            </div>
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <h3 className="text-xl font-semibold">Power User</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">For heavy users and API access</p>
                <div className="mb-4 min-h-[4.5rem]">
                  <div className="text-3xl font-bold">{isYearly ? "$20.40" : "$24"}</div>
                  <div className="text-sm text-gray-500">{isYearly ? "per month" : "per month"}</div>
                  <div className="text-xs text-gray-500 h-4">{isYearly ? "Billed $244/year" : ""}</div>
                </div>
              </div>
              <ul className="space-y-3 flex-1">
                <li className="flex items-center gap-2">
                  <Infinity className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium">Unlimited uploads</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">5GB per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Unlimited podcasts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium">API Access</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          <Card className="relative flex flex-col h-full border-2">
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-5 w-5 text-purple-500" />
                  <h3 className="text-xl font-semibold">Professional</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">For large workloads</p>
                <div className="mb-4 min-h-[4.5rem]">
                  <div className="text-3xl font-bold">{isYearly ? "$40.80" : "$48"}</div>
                  <div className="text-sm text-gray-500">{isYearly ? "per month" : "per month"}</div>
                  <div className="text-xs text-gray-500 h-4">{isYearly ? "Billed $489/year" : ""}</div>
                </div>
              </div>
              <ul className="space-y-3 flex-1">
                <li className="flex items-center gap-2">
                  <Infinity className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium">Unlimited uploads</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">12GB per month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Unlimited podcasts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Bandwidth rolls over each month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium">API Access</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="text-center mt-12 max-w-2xl mx-auto">
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800 dark:text-green-400">100% Free to Start</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              No credit card required. Start with our free tier and upgrade only when you need more capacity. Cancel
              anytime with no questions asked.
            </p>
          </div>
        </div>
      </section>
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8 opacity-90">Create your first podcast feed in minutes. No credit card required.</p>
          <Link to="/signin">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Start Converting Now
              <ArrowRight className="ml-2 h-5 w-5" />
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
      <CardContent className="p-6">
        <div className="inline-flex items-center justify-center p-3 mb-4 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 text-blue-600 dark:text-blue-400">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300">{description}</p>
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
    <div className="flex gap-6 items-start">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center text-xl font-bold">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300">{description}</p>
      </div>
    </div>
  );
}
