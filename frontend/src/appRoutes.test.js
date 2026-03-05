import fs from 'fs';
import path from 'path';

describe('App route declarations', () => {
  it('does not declare duplicate critical routes', () => {
    const appPath = path.join(__dirname, 'App.js');
    const appSource = fs.readFileSync(appPath, 'utf8');

    const teacherPickupRouteCount = (appSource.match(/path="\/teacher\/pickup-check"/g) || []).length;
    const parentGuideRouteCount = (appSource.match(/path="\/guides\/parent-communication-step-4"/g) || []).length;

    expect(teacherPickupRouteCount).toBe(1);
    expect(parentGuideRouteCount).toBe(1);
  });
});
