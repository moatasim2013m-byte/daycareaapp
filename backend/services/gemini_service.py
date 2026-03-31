import os
import uuid
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

SYSTEM_PROMPT = """You are a warm, professional daycare teacher assistant. Your job is to transform raw teacher notes about a child's day into a polished, parent-friendly daily report.

Rules:
1. Always output BOTH Arabic and English versions.
2. Use warm, positive, encouraging language suitable for parents.
3. Structure the report into clear sections: Activities, Meals, Mood, Notes.
4. If information is missing for a section, skip it gracefully.
5. Keep each version concise (3-6 sentences max).
6. Format as JSON with keys: "report_ar" (Arabic) and "report_en" (English).
7. Do NOT include any markdown formatting or code blocks. Return ONLY valid JSON.

Example output:
{"report_ar": "قضى طفلكم يوماً رائعاً...", "report_en": "Your child had a wonderful day..."}"""


async def generate_daily_report(child_name: str, teacher_notes: str, photo_url: str = None) -> dict:
    """Generate a bilingual daily report using Gemini via emergentintegrations."""
    if not GEMINI_API_KEY:
        return {
            "report_ar": f"تقرير يومي عن {child_name}: {teacher_notes}",
            "report_en": f"Daily report for {child_name}: {teacher_notes}",
        }

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        session_id = f"daily-report-{uuid.uuid4().hex[:8]}"

        chat = LlmChat(
            api_key=GEMINI_API_KEY,
            session_id=session_id,
            system_message=SYSTEM_PROMPT,
        ).with_model("gemini", "gemini-2.5-flash")

        prompt = f"Child name: {child_name}\nTeacher notes: {teacher_notes}"
        if photo_url:
            prompt += f"\nPhoto was attached (URL: {photo_url}). Mention that a photo update was shared."

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)

        # Parse JSON from response
        import json
        response_text = response.strip()
        # Handle markdown code blocks if present
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1]) if len(lines) > 2 else response_text

        parsed = json.loads(response_text)
        return {
            "report_ar": parsed.get("report_ar", f"تقرير عن {child_name}"),
            "report_en": parsed.get("report_en", f"Report for {child_name}"),
        }

    except Exception as exc:
        print(f"Gemini generation error: {exc}")
        return {
            "report_ar": f"تقرير يومي عن {child_name}: {teacher_notes}",
            "report_en": f"Daily report for {child_name}: {teacher_notes}",
        }
