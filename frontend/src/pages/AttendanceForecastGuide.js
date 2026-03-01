import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const AttendanceForecastGuide = () => {
  const helpPoints = [
    'Plan staff allocation for the day',
    'Track expected vs actual attendance',
    'Prepare classrooms in advance',
    'Monitor attendance trends across programs',
    'Quickly identify absences',
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Forecast</h1>
          <p className="mt-2 text-sm text-gray-500">Updated over a week ago</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 leading-7">
            <p>
              The Attendance Forecast section gives you a quick snapshot of expected attendance across your programs
              for a selected date. It helps you plan staffing, manage classrooms, and stay prepared for the day by
              showing how many students are expected, checked in, checked out, or absent.
            </p>
            <p>
              This view is especially useful for center heads and admins to understand daily attendance trends at a glance.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Where to find this</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700">
            <p>Go to: <strong>Attendance &amp; Leaves → Attendance Forecast</strong></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What you&apos;ll see on this page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-gray-700">
            <p>At the top of the page, you can filter and view attendance details using:</p>
            <ul className="list-disc ml-6 space-y-1">
              <li><strong>Select Date</strong> – Choose the date for which you want to view the forecast.</li>
              <li><strong>Split by</strong> – View data grouped by <strong>Program</strong> (default).</li>
            </ul>
            <p>The table below displays attendance details based on your selection.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Understanding the columns</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700">
            <p>Each row represents a program scheduled for the selected date.</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>Program</strong> – Name of the program and its scheduled timing.</li>
              <li><strong>Expected Students</strong> – Number of students scheduled to attend that program.</li>
              <li><strong>Checked-in</strong> – Students who have been marked present.</li>
              <li><strong>Checked-out</strong> – Students who have been checked out for the day.</li>
              <li><strong>Absent</strong> – Students marked absent.</li>
            </ul>
            <p className="mt-3">This gives you a clear comparison between expected attendance and actual attendance.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How this helps your center</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700">
            <ul className="list-disc ml-6 space-y-1">
              {helpPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <p className="mt-3">
              You can use this section at the start of the day to understand how many students are expected and
              whether staffing adjustments are needed.
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-300">
          <CardHeader>
            <CardTitle>Important note</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700">
            <p>This is a view-only dashboard.</p>
            <p className="mt-2">
              To update attendance, mark check-in, check-out, or absences from the Student Attendance section.
              The forecast updates automatically based on those changes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AttendanceForecastGuide;
