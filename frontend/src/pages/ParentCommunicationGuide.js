import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Camera, MessageCircle, AlertTriangle, FileText } from 'lucide-react';

const ParentCommunicationGuide = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" dir="ltr">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Step 4/7 - Share Activity Updates & Message Parents 💬</h1>
            <p className="text-gray-600 mt-2">Keep parents connected to their child&apos;s day through activities, reports, and direct communication.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Camera className="w-5 h-5 text-blue-600" />
              1. Post Daily Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <p><span className="font-semibold">Navigate to:</span> Parent Communication → Activities</p>

            <section className="space-y-2">
              <h2 className="font-semibold text-gray-900">✅ Today&apos;s Activities</h2>
              <p>This is your core screen for recording and sharing what students did during the day.</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Assign activities to an individual student, entire classroom, or a program/group.</li>
                <li>Choose from preset activity types like meals, naps, learning time, and playtime.</li>
                <li>Select any activity to post an update to parents in real-time.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold text-gray-900">✏️ Customizing Activities</h2>
              <p><span className="font-semibold">Go to:</span> Settings → Activity</p>
              <p>Use the <span className="font-semibold">Enable/Disable Activity</span> toggle to control which activity types appear.</p>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Daily Report
              </h2>
              <p>A per-student summary view of all daily activity updates.</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>View which activities each student was involved in.</li>
                <li>Quickly update or backfill entries for individual children.</li>
                <li>Track development and engagement student by student.</li>
              </ul>
              <p className="bg-indigo-50 text-indigo-800 p-3 rounded-md">🖱️ Quick Access: Click the <span className="font-semibold">Post Activity</span> button on the top menu (web version).</p>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <MessageCircle className="w-5 h-5 text-green-600" />
              2. Send Direct Messages to Parents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <p><span className="font-semibold">Navigate to:</span> Parent Communication → Messages / Concerns / Parent Notes</p>

            <section className="space-y-2">
              <h2 className="font-semibold text-gray-900">💬 Messages</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Two-way communication between teachers/admins and parents.</li>
                <li>Both parents and staff can initiate conversations.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Concerns & Parent Notes
              </h2>
              <p>Initiated only by parents from the Illumine Parent App.</p>
              <p>Best used for health concerns, home updates, and quick notes to teachers.</p>
            </section>

            <p className="bg-green-50 text-green-800 p-3 rounded-md">👨‍👩‍👧‍👦 Try it yourself: Add your email/phone as a test parent to experience and validate the parent view.</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6 space-y-3">
            <p className="text-gray-800 font-medium">🎯 You&apos;re now equipped to keep parents engaged, informed, and connected with classroom life.</p>
            <p className="text-gray-700">Continue to Step 5 → Set up Invoices, Tuition Plans, Discounts, and Taxes.</p>
            <p className="text-sm text-gray-500">Need help setting up activity posts or testing parent communication? Schedule a free onboarding session for personalized assistance.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ParentCommunicationGuide;
