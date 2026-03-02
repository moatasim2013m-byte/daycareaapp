import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';

const SetupCenterDetailsRoles = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-3">
        <Badge variant="secondary">Getting Started with illumine</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Step 1/7 - Setting Up Illumine: Center Details &amp; Roles</h1>
        <p className="text-muted-foreground">
          We’re glad to have you onboard. The initial setup usually takes 15–20 minutes, and once completed,
          your center is ready to start using Illumine effectively.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1) Use Illumine on the Web</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Start by logging in from your desktop or laptop. Using Illumine on the web is recommended during
            initial setup.
          </p>
          <p>Tip: Bookmark the login page for quick access.</p>
          <p>
            Web support: <span className="font-medium text-foreground">Windows, MacBook, iMac &amp; Linux</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2) Install the Illumine Mobile App</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Download the mobile app to manage daily tasks on the go.</p>
          <p>Teachers and parents also use the app to access their respective accounts.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>illumine App for Android Phones</li>
            <li>illumine App for iOS Devices</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3) Set Up Your School Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            From the left-hand menu, go to <span className="font-medium text-foreground">Settings → School Details</span>.
          </p>
          <p>Add the following information:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>School / Center name</li>
            <li>Address and contact details</li>
            <li>School logo</li>
          </ul>
          <p>
            Optional: Add bank account details to explore billing and payment features (sample/test data can be
            used during setup).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4) Set Up Staff Roles and Access Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Defining staff access levels improves data security and keeps operations smooth.
          </p>
          <p>
            Go to <span className="font-medium text-foreground">Settings → Access Control System</span>, then:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Assign existing roles (Teacher, Admin, Center Head, etc.)</li>
            <li>Define module-wise access per role (Attendance, Billing, Communication, etc.)</li>
            <li>Create custom roles with tailored permissions</li>
          </ul>
          <p>
            🎯 Pro Tip: Set roles before adding staff for accurate permission mapping during onboarding.
          </p>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>✅ Ready for the Next Steps?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Once your app is installed and roles are configured, continue with adding classrooms, staff, and
            students.
          </p>
          <p>
            Next: <span className="font-medium text-foreground">Step 2/7 - Onboard Staff and Students &amp; Send Invites</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupCenterDetailsRoles;
