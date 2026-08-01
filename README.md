# FanRush_Teaser
# FanRush, Streamer Support Platform

FanRush is a full-stack support platform that allows viewers to financially support streamers and content creators.

This repository contains the public demo version of FanRush, showing the core workflow of the platform:
user support → payment processing → payment confirmation → invoice generation.

The original version contains additional features that are not included in this public release, such as YouTube API integration, media sharing features, AI text-to-speech functionality and extended streamer tools.

---

## Features

- Modern support/donation interface
- Custom support amounts
- Support messages
- Stripe Checkout payment integration
- Stripe webhook payment confirmation
- Automatic invoice generation through Számlázz.hu API
- Email-based payment confirmation flow
- Success and cancelled payment pages
- Responsive frontend interface

---

## Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express.js

### Integrations
- Stripe Checkout API
- Stripe Webhooks
- Számlázz.hu Invoice Agent XML API

---

## How it works

1. The user selects a support amount.
2. The frontend sends the payment request to the backend.
3. The backend creates a Stripe Checkout session.
4. The user completes the payment securely through Stripe.
5. Stripe sends a webhook notification to the backend.
6. The system processes the payment and generates invoice data.
7. The user is redirected to the confirmation page.

---

## Public Demo Version

This release is intended as a public showcase of the main architecture and payment workflow.

The complete FanRush system includes additional functionality that is not part of this repository.

---

## Setup

Before running the project, please read:

`How to Start FanRush.txt`

This file contains information about:
- environment variables
- Stripe configuration
- backend startup
- frontend setup
- required dependencies

---

## Project Status

FanRush is currently under active development.

The public repository represents a stable demo version of the platform.
