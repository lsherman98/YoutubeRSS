/**
 * Example Usage Guide for Instruction Components
 *
 * This file demonstrates how to use the instruction components
 * with screenshots that you'll provide later.
 */

import {
  InstructionStep,
  InstructionSteps,
  InstructionText,
  InstructionNote,
  InstructionCodeBlock,
} from "./instruction-steps";
import { InstructionScreenshot, InstructionScreenshotGrid } from "./instruction-screenshot";

/**
 * EXAMPLE 1: Basic Step-by-Step Instructions
 */
function ExampleBasicSteps() {
  return (
    <InstructionSteps>
      <InstructionStep number={1}>Open the app and navigate to settings.</InstructionStep>

      {/* Add screenshot - replace undefined with your image URL */}
      <InstructionScreenshot
        src={undefined} // Replace with: "/path/to/screenshot.png"
        alt="Settings screen"
        description="Navigate to the settings menu"
      />

      <InstructionStep number={2}>Tap on "Add Podcast" button.</InstructionStep>

      <InstructionScreenshot
        src={undefined} // Replace with your screenshot URL
        alt="Add podcast button"
        description="Locate the Add Podcast button"
      />
    </InstructionSteps>
  );
}

/**
 * EXAMPLE 2: Multiple Screenshots in a Grid
 */
function ExampleScreenshotGrid() {
  return (
    <div>
      <InstructionStep number={1}>Here are multiple views of the interface:</InstructionStep>

      <InstructionScreenshotGrid columns={2}>
        <InstructionScreenshot
          src={undefined} // Replace with your screenshot URL
          alt="Mobile view"
          description="Mobile interface"
        />
        <InstructionScreenshot
          src={undefined} // Replace with your screenshot URL
          alt="Desktop view"
          description="Desktop interface"
        />
      </InstructionScreenshotGrid>
    </div>
  );
}

/**
 * EXAMPLE 3: Adding Notes and Code Blocks
 */
function ExampleWithNotesAndCode() {
  return (
    <InstructionSteps>
      <InstructionStep number={1}>Copy your RSS feed URL.</InstructionStep>

      <InstructionCodeBlock label="Your RSS Feed URL:" code="https://example.com/podcast/feed.xml" />

      <InstructionNote variant="info">
        <strong>Tip:</strong> This URL is unique to your podcast and should be kept safe.
      </InstructionNote>

      <InstructionNote variant="warning">
        <strong>Warning:</strong> Don't share this URL publicly if you want to keep your podcast private.
      </InstructionNote>

      <InstructionNote variant="success">
        <strong>Success!</strong> Your podcast has been added successfully.
      </InstructionNote>
    </InstructionSteps>
  );
}

/**
 * EXAMPLE 4: Mixed Content with Text
 */
function ExampleMixedContent() {
  return (
    <div className="space-y-4">
      <InstructionText>Before you begin, make sure you have the latest version of the app installed.</InstructionText>

      <InstructionSteps>
        <InstructionStep number={1}>Launch the application on your device.</InstructionStep>

        <InstructionScreenshot
          src={undefined} // Your screenshot here
          alt="App launcher"
          description="Find and tap the app icon"
        />

        <InstructionStep number={2}>Follow the on-screen instructions to complete setup.</InstructionStep>
      </InstructionSteps>

      <InstructionText>If you encounter any issues, please refer to the troubleshooting guide.</InstructionText>
    </div>
  );
}

/**
 * HOW TO ADD YOUR SCREENSHOTS:
 *
 * Option 1: Place images in the public folder
 * ----------------------------------------
 * 1. Add your images to: /public/screenshots/
 * 2. Reference them as: src="/screenshots/apple-podcasts-step1.png"
 *
 * Option 2: Use an external URL
 * ----------------------------------------
 * 1. Host your images on a CDN or image hosting service
 * 2. Reference them as: src="https://your-cdn.com/image.png"
 *
 * Option 3: Import images (recommended for bundled assets)
 * ----------------------------------------
 * 1. Place images in: /src/assets/screenshots/
 * 2. Import at the top: import screenshot1 from "@/assets/screenshots/step1.png"
 * 3. Reference them as: src={screenshot1}
 *
 * EXAMPLE with actual image:
 *
 * import appleStep1 from "@/assets/screenshots/apple-step1.png";
 *
 * <InstructionScreenshot
 *   src={appleStep1}
 *   alt="Apple Podcasts library screen"
 *   description="Navigate to the Library tab"
 * />
 */

export { ExampleBasicSteps, ExampleScreenshotGrid, ExampleWithNotesAndCode, ExampleMixedContent };
