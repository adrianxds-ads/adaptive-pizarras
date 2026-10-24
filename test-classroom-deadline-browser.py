"""Classroom B2 quick quiz deadline regression in isolated headless Edge."""
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import json

ROOT=Path(__file__).resolve().parent
BASE="https://adrianxds-ads.github.io/adaptive-pizarras/?qa=deadline-test"
results=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,channel="msedge")
    for width,height in ((360,740),(412,915)):
        ctx=browser.new_context(viewport={"width":width,"height":height},service_workers="block")
        ctx.add_init_script("localStorage.setItem('pizarras_read_first_v1','0')")
        page=ctx.new_page()
        errors=[]
        page.on("pageerror",lambda e:errors.append(str(e)))
        def intercept(route):
            u=urlparse(route.request.url)
            f=ROOT/(u.path.split("/")[-1] or "index.html")
            if u.path.startswith("/adaptive-pizarras/") and f.is_file():
                mime={".js":"application/javascript",".css":"text/css",".json":"application/json",
                      ".html":"text/html",".webmanifest":"application/manifest+json",
                      ".png":"image/png",".svg":"image/svg+xml"}.get(f.suffix,"application/octet-stream")
                route.fulfill(path=str(f),content_type=mime)
            else:route.continue_()
        page.route("**/adaptive-pizarras/**",intercept)
        page.goto(BASE,wait_until="domcontentloaded",timeout=45000)
        page.locator("#quickBtn").click()
        page.wait_for_function("session && session.type==='quick' && current && deadline>Date.now() && document.querySelectorAll('#answers button.answer').length===4",timeout=45000)
        expired=page.evaluate("""() => {
            quizFlow.cancel();
            clearInterval(timerHandle);
            const before=session.records.length;
            deadline=Date.now()-250;
            const option=[...document.querySelectorAll('#answers button.answer')].find(b=>b.textContent===current.correct);
            answer(current.correct,option,false);
            const rec=session.records.at(-1);
            answer(current.correct,option,false);
            return {added:session.records.length-before,correct:rec.ok,elapsed:rec.time,
                    answer:rec.answer,score:session.correct,limit:TIME_LIMIT};
        }""")
        ontime=page.evaluate("""() => {
            quizFlow.cancel();
            renderQuestion();
            clearInterval(timerHandle);
            const before=session.records.length;
            const option=[...document.querySelectorAll('#answers button.answer')].find(b=>b.textContent===current.correct);
            answer(current.correct,option,false);
            return {added:session.records.length-before,correct:session.records.at(-1).ok,
                    elapsed:session.records.at(-1).time};
        }""")
        study=page.evaluate("""() => {
            quizFlow.cancel();
            clearInterval(timerHandle);
            session=makeStudySession();
            renderQuestion();
            clearInterval(timerHandle);
            const endsBefore=session.endsAt;
            deadline=Date.now()-250;
            const chosen=[...document.querySelectorAll('#answers button.answer')].find(b=>b.textContent===current.correct);
            answer(current.correct,chosen,false);
            return {type:session.type,questionCount:session.questionCount,correct:session.records.at(-1).ok,
                    timeoutRecorded:session.errors.at(-1)?.shown==='TIME',
                    endsAtUnchanged:session.endsAt===endsBefore,sessionFinished:!!session.finished};
        }""")
        results.append({"viewport":f"{width}x{height}","expired":expired,"onTime":ontime,"study":study,"errors":errors})
        ctx.close()
    browser.close()
print(json.dumps(results))
for r in results:
    x,y=r["expired"],r["onTime"]
    assert x["added"]==1 and x["correct"] is False, "Late input must not score"
    assert x["elapsed"]==x["limit"] and x["answer"] is None, "Timeout must not select an answer"
    assert y["added"]==1 and y["correct"] is True, "On-time correct must count once"
    s=r["study"]
    assert s["type"]=="study" and s["questionCount"]==1 and s["correct"] is False and s["timeoutRecorded"], "Study class must reject late answer"
    assert s["endsAtUnchanged"] and not s["sessionFinished"], "Study contract clock must remain unchanged"
    assert not r["errors"],r["errors"]
print("PASS Classroom B2 quick quiz timeout and normal score in both viewports")
