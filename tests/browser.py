"""Real packaged browser checks. No production test hooks or state injection.

uv run --no-project --with playwright==1.62.0 python tests/browser.py
Set BROWSER_EXECUTABLE only to use an existing local Chromium installation.
"""
from pathlib import Path
from functools import partial
import hashlib
import http.server
import json
import math
import os
import subprocess
import threading
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'test-results'
OUT.mkdir(exist_ok=True)
receipt = {'commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
           'status': 'RUNNING', 'checks': [], 'error': None}


def record(name):
    receipt['checks'].append(name)
    print('PASS:', name, flush=True)
    (OUT / 'browser-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{server.server_port}/'
errors = []


def advance(page, ms=150):
    page.clock.run_for(round(ms))


def pose(page):
    return json.loads(page.locator('#world').get_attribute('data-position'))


def hold(page, key, ms):
    page.locator('#world').focus()
    page.keyboard.down(key)
    advance(page, ms)
    page.keyboard.up(key)
    advance(page, 50)


def travel_axis(page, axis, target):
    # Keep the original northward heading; use real W/S/A/D controls.
    for _ in range(12):
        before = pose(page)
        delta = target - before[axis]
        if abs(delta) < .16:
            return
        key = ('d' if delta > 0 else 'a') if axis == 'x' else ('s' if delta > 0 else 'w')
        hold(page, key, min(1500, max(34, abs(delta) / 3.12 * 1000)))
    raise AssertionError(f'Could not walk {axis} to {target}: {pose(page)}')


def open_lab(page, title):
    page.locator('#inspect').click()
    expect(page.locator('#lab-title')).to_have_text(title)
    advance(page)


def close_lab(page):
    page.get_by_role('button', name='Exhibit restored — back to station', exact=True).click()
    advance(page)


try:
    (OUT / 'browser-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    with sync_playwright() as pw:
        options = {'headless': True}
        if os.environ.get('BROWSER_EXECUTABLE'):
            options['executable_path'] = os.environ['BROWSER_EXECUTABLE']
        browser = pw.chromium.launch(**options)
        context = browser.new_context(viewport={'width': 1440, 'height': 1060})
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.clock.install()
        page.goto(URL)
        expect(page.locator('#start')).to_be_visible()
        advance(page, 500)
        page.screenshot(path=str(OUT / 'desktop-start.png'), full_page=True)
        expect(page.locator('footer')).to_contain_text('We are not members of the School of Tomorrow')
        page.locator('#start').click()
        advance(page, 200)
        expect(page.locator('#wayfinder')).to_be_visible()
        expect(page.locator('#wayfinder-target')).to_have_text('The Minimum Department')
        expect(page.locator('#inspect')).to_be_disabled()
        page.keyboard.press('e')
        expect(page.locator('#lab')).to_be_hidden()
        page.locator('#sound').click()
        expect(page.locator('#sound')).to_have_attribute('aria-pressed', 'true')
        before = pose(page)
        hold(page, 'w', 500)
        assert pose(page)['y'] < before['y'] - .8
        hold(page, 'a', 300)
        assert pose(page)['x'] < before['x'] - .5
        travel_axis(page, 'x', 9.5)
        record('actual keyboard movement and lateral strafing')

        page.keyboard.down('w')
        page.locator('#view-mode').click()
        expect(page.locator('body')).to_have_attribute('data-view', 'fit')
        stopped = pose(page)
        advance(page, 400)
        assert pose(page) == stopped
        page.keyboard.up('w')
        page.screenshot(path=str(OUT / 'desktop-fit.png'), full_page=True)
        page.locator('#view-mode').click()
        expect(page.locator('body')).to_have_attribute('data-view', 'page')
        page.locator('#fullscreen').click()
        expect(page.locator('body')).to_have_attribute('data-view', 'fullscreen')
        assert page.evaluate('document.fullscreenElement === document.documentElement')
        page.locator('#fullscreen').click()
        expect(page.locator('body')).to_have_attribute('data-view', 'page')
        record('VANILLAJS fit/fullscreen transitions release held input and restore page view')

        page.keyboard.down('w')
        page.keyboard.press('p')
        advance(page, 200)
        stopped = pose(page)
        advance(page, 1000)
        assert pose(page) == stopped
        page.keyboard.up('w')
        page.locator('#resume').click()
        advance(page, 500)
        assert pose(page) == stopped
        record('pause clears held input with no catch-up')

        # Do not refocus the canvas between pause and resume: Resume owns focus.
        for shortcut in ['p', 'Escape']:
            page.keyboard.down(shortcut)
            expect(page.locator('#paused')).to_be_visible()
            expect(page.locator('#resume')).to_be_focused()
            page.keyboard.down(shortcut)  # OS key repeat must not toggle again.
            expect(page.locator('#paused')).to_be_visible()
            page.keyboard.up(shortcut)
            advance(page, 250)
            paused_tick = page.locator('#world').get_attribute('data-tick')
            advance(page, 300)
            assert page.locator('#world').get_attribute('data-tick') == paused_tick
            page.keyboard.press(shortcut)
            expect(page.locator('#paused')).to_be_hidden()
            expect(page.locator('#world')).to_be_focused()
            advance(page, 150)
            assert int(page.locator('#world').get_attribute('data-tick')) > int(paused_tick)

        # Exercise the actual blur handler without injecting game state.
        page.evaluate("window.dispatchEvent(new Event('blur'))")
        expect(page.locator('#resume')).to_be_focused()
        page.keyboard.press('Escape')
        expect(page.locator('#paused')).to_be_hidden()
        expect(page.locator('#world')).to_be_focused()

        # Non-pause keys retain native button behaviour.
        page.keyboard.press('p')
        page.keyboard.press('Space')
        expect(page.locator('#paused')).to_be_hidden()
        record('P/Escape resume from focused Resume, ignore repeats and recover after blur; Space stays native')

        # Temporary DOM fixtures verify editable targets; they do not alter game state.
        for element in ['input', 'textarea', 'select', 'div']:
            page.evaluate("""tag => {
                const field = document.createElement(tag);
                field.id = 'editable-fixture';
                if (tag === 'div') field.contentEditable = 'true';
                document.body.append(field);
            }""", element)
            page.locator('#editable-fixture').focus()
            for shortcut in ['p', 'Escape']:
                page.keyboard.press(shortcut)
                expect(page.locator('#paused')).to_be_hidden()
                expect(page.locator('#editable-fixture')).to_be_focused()
            page.locator('#editable-fixture').evaluate('(field) => field.remove()')

        page.locator('#notes').click()
        page.keyboard.press('p')
        expect(page.locator('#notebook')).to_be_visible()
        expect(page.locator('#paused')).to_be_hidden()
        page.keyboard.press('Escape')
        expect(page.locator('#notebook')).to_be_hidden()
        expect(page.locator('#paused')).to_be_hidden()
        page.locator('#world').focus()
        record('editable fields and notebook retain their keyboard handling')

        travel_axis(page, 'y', 4.8)
        expect(page.locator('#interaction')).to_have_attribute('data-ready', 'true')
        expect(page.locator('#inspect-hint')).to_be_visible()
        expect(page.locator('#inspect')).to_be_enabled()
        expect(page.locator('#interaction-help')).to_contain_text('Press E or tap')
        expect(page.locator('#wayfinder')).to_be_hidden()
        button = page.locator('#inspect').bounding_box()
        assert button['width'] >= 170 and button['height'] >= 60
        page.screenshot(path=str(OUT / 'desktop-play.png'), full_page=True)
        page.keyboard.press('e')
        expect(page.locator('#lab-title')).to_have_text('The Minimum Department')
        expect(page.locator('#lab')).to_be_visible()
        expect(page.locator('#inspect-hint')).to_be_hidden()
        record('prominent Inspect prompt opens the reachable experiment with E')
        page.keyboard.press('p')
        expect(page.locator('#lab')).to_be_visible()
        expect(page.locator('#paused')).to_be_hidden()
        page.keyboard.press('Escape')
        expect(page.locator('#lab')).to_be_hidden()
        expect(page.locator('#paused')).to_be_hidden()
        open_lab(page, 'The Minimum Department')
        record('experiment Escape closes the dialog without pausing the station')
        for edge in ['AB', 'AC', 'AD', 'BC', 'BD', 'CD']:
            page.get_by_role('button', name='Join ' + edge, exact=True).click()
        expect(page.locator('#lab-readout')).to_contain_text('6 / 6')
        page.screenshot(path=str(OUT / 'tetrahedron-lab.png'), full_page=True)
        close_lab(page)

        travel_axis(page, 'y', 9.5)
        travel_axis(page, 'x', 4.8)
        open_lab(page, 'The Volume Bureau')
        page.get_by_role('button', name='Compare volumes', exact=True).click()
        expect(page.locator('#lab-feedback')).to_contain_text('You have 0 units')
        page.get_by_role('button', name='+4 octahedron', exact=True).click()
        page.get_by_role('button', name='Compare volumes', exact=True).click()
        for _ in range(5):
            page.get_by_role('button', name='+4 octahedron', exact=True).click()
        page.get_by_role('button', name='Compare volumes', exact=True).click()
        close_lab(page)

        travel_axis(page, 'x', 14.2)
        open_lab(page, 'Neighbourhood Watch')
        for a, b in [(0, 3), (1, 2), (4, 7), (5, 6), (8, 11), (9, 10)]:
            page.get_by_role('button', name=f'Point {a+1}', exact=True).click()
            page.get_by_role('button', name=f'Point {b+1}', exact=True).click()
        close_lab(page)
        travel_axis(page, 'x', 9.5)
        travel_axis(page, 'y', 15.2)
        open_lab(page, 'The Coordinate Office')
        for _ in range(3):
            page.get_by_role('button', name='Subtract 1 from all four', exact=True).click()
        expect(page.locator('#lab-readout')).to_contain_text('[2, 0, 1, 0]')
        close_lab(page)
        expect(page.locator('#seal-count')).to_have_text('04 / 04')
        record('all four experiments completed through actual UI, including a wrong answer')

        travel_axis(page, 'y', 9.5)
        travel_axis(page, 'x', 8.5)
        page.keyboard.press('f')
        page.keyboard.press('q')
        page.keyboard.press('f')
        hold(page, 'Space', 2100)
        expect(page.locator('#victory')).to_be_visible()
        page.screenshot(path=str(OUT / 'expedition-complete.png'), full_page=True)
        page.locator('#continue').click()
        before = pose(page)
        hold(page, 'w', 200)
        assert pose(page) != before
        record('two-probe relay victory and post-victory exploration')

        with page.expect_download() as event:
            page.locator('#save').click()
        saved = Path(event.value.path()).read_bytes()
        data = json.loads(saved)
        assert data['state']['won'] is True
        page.locator('#file').set_input_files({'name': 'bad.json', 'mimeType': 'application/json', 'buffer': b'{"kind":"broken"}'})
        expect(page.locator('#status')).to_contain_text('File rejected')
        expect(page.locator('#seal-count')).to_have_text('04 / 04')
        page.locator('#file').set_input_files({'name': 'save.json', 'mimeType': 'application/json', 'buffer': saved})
        expect(page.locator('#status')).to_contain_text('Expedition restored')
        record('save download, valid restore and atomic rejection of malformed JSON')

        page.locator('#notes').click()
        with page.expect_download() as event:
            page.locator('#wav').click()
        wav = Path(event.value.path()).read_bytes()
        assert hashlib.sha256(wav).hexdigest() == 'b2108a62f79dca00bb515c190d3c021b3d6adf837ea86398a6cf2fea579beee3'
        page.locator('#close-notes').click()
        expect(page.locator('#sound')).to_have_attribute('aria-pressed', 'true')
        advance(page, 150)
        page.locator('#sound').click()
        expect(page.locator('#sound')).to_have_attribute('aria-pressed', 'false')
        record('deterministic browser WAV export and explicit sound controls')

        page.wait_for_function('navigator.serviceWorker.controller !== null')
        context.set_offline(True)
        page.reload()
        expect(page.locator('#start')).to_contain_text('Continue expedition')
        page.locator('#start').click()
        advance(page, 200)
        expect(page.locator('#seal-count')).to_have_text('04 / 04')
        record('offline reload with local expedition persistence')
        context.close()

        for width in [390, 320]:
            mobile = browser.new_context(viewport={'width': width, 'height': 844}, has_touch=True, reduced_motion='reduce')
            page = mobile.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.clock.install()
            page.goto(URL)
            advance(page, 300)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            expect(page.locator('#motion')).to_be_checked()
            expect(page.locator('footer')).to_be_visible()
            page.screenshot(path=str(OUT / f'mobile-{width}.png'), full_page=True)
            page.locator('#start').click()
            advance(page, 150)
            control = page.get_by_role('button', name='Move forward', exact=True)
            control.scroll_into_view_if_needed()
            before = pose(page)
            rect = control.bounding_box()
            view = page.locator('#world').bounding_box()
            assert rect['y'] + rect['height'] <= 844
            assert view['y'] + view['height'] - max(0, view['y']) >= 200, 'The game must stay visible while steering'
            page.mouse.move(rect['x'] + rect['width']/2, rect['y'] + rect['height']/2)
            page.mouse.down()
            advance(page, 500)
            page.mouse.up()
            advance(page, 100)
            assert pose(page)['y'] < before['y'] - .8, f'Held movement failed at {width}px: {before} -> {pose(page)}'
            stopped = pose(page)
            advance(page, 500)
            assert pose(page) == stopped
            travel_axis(page, 'y', 4.8)
            expect(page.locator('#inspect-hint')).to_be_visible()
            expect(page.locator('#inspect')).to_be_enabled()
            button = page.locator('#inspect').bounding_box()
            assert button['width'] >= 100 and button['height'] >= 60
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            page.screenshot(path=str(OUT / f'mobile-inspect-{width}.png'), full_page=True)
            open_lab(page, 'The Minimum Department')
            page.keyboard.press('Escape')
            expect(page.locator('#lab')).to_be_hidden()
            record(f'{width}px touch layout, motion preference and held-control release')
            mobile.close()

        fallback = browser.new_context(viewport={'width': 900, 'height': 900})
        fallback.add_init_script("Object.defineProperty(window,'AudioContext',{value:undefined}); Object.defineProperty(window,'webkitAudioContext',{value:undefined}); Storage.prototype.setItem=function(){throw new Error('storage blocked')}; Element.prototype.requestFullscreen=async function(){throw new Error('fullscreen denied')};")
        page = fallback.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.clock.install()
        page.goto(URL)
        advance(page, 200)
        page.locator('#start').click()
        page.locator('#fullscreen').click()
        expect(page.locator('body')).to_have_attribute('data-view', 'fit')
        expect(page.locator('#status')).to_contain_text('Fullscreen unavailable')
        expect(page.locator('#view-mode')).to_be_enabled()
        page.locator('#sound').click()
        expect(page.locator('#status')).to_contain_text('Audio unavailable')
        before = pose(page)
        hold(page, 'w', 500)
        assert pose(page)['y'] < before['y'] - .8
        with page.expect_download() as event:
            page.locator('#save').click()
        assert json.loads(Path(event.value.path()).read_text())['kind'] == 'concentric.save.v1'
        record('denied fullscreen, unavailable audio and blocked storage do not stop gameplay or download saves')
        fallback.close()
        assert not errors, errors
        browser.close()
    receipt['status'] = 'PASS'
except Exception as error:
    receipt['status'] = 'FAIL'
    receipt['error'] = repr(error)
    raise
finally:
    receipt['pageErrors'] = errors
    (OUT / 'browser-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    server.shutdown()
