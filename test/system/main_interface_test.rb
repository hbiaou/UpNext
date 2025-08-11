require "test_helper"

class ApplicationSystemTest < ActionDispatch::SystemTestCase
  driven_by :rack_test

  test "should display the main interface components" do
    visit root_path

    # Check main app title and branding
    assert_text "UpNext"
    assert_text "AI Assistant"

    # Check for Stimulus controllers presence
    assert_css "[data-controller~=tasks]"
    assert_css "[data-controller~=chat]"
    assert_css "[data-controller~=settings]"

    # Check for tab navigation
    assert_css "button[data-tab=today]"
    assert_css "button[data-tab=upcoming]"
    assert_css "button[data-tab=completed]"
  end

  test "should have proper responsive layout structure" do
    visit root_path

    # Check two-panel layout exists
    assert_css "main.grid"
    assert_css "aside[data-controller~=chat]"  # Left panel
    assert_css "section[data-controller~=tasks]"  # Right panel
  end

  test "should include interactive elements" do
    visit root_path

    # Chat input
    assert_css "input[placeholder*=Ask me to help]"

    # Quick task input
    assert_css "input[placeholder*=Add a task for today]"

    # Settings button
    assert_css "button[data-action*=settings#open]"
  end

  test "should have proper PWA and offline capabilities" do
    visit root_path

    # Check for service worker registration script
    assert_match /serviceWorker/, page.html
    assert_match /navigator\.serviceWorker\.register/, page.html
  end
end
