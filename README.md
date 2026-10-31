# Payloop

Payloop is a subscription-management experience for recurring-revenue businesses.
This first UI slice includes a marketing landing page and a customer self-service
portal, based on the supplied product brief and design.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page and
[http://localhost:3000/dashboard](http://localhost:3000/dashboard) for the
customer portal. The account entry points are [Log in](http://localhost:3000/login),
[Sign up](http://localhost:3000/signup), and
[Plans & pricing](http://localhost:3000/plans).

The portal and account forms currently use local demo data. PostgreSQL integration,
authentication, payment processing, and server-backed billing operations are not
part of this UI-only implementation. Subscription and payment changes are not saved
between visits.
