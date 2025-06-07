import subprocess, json, os

def test_generator_sine():
    env = os.environ.copy()
    env["TEST_MODE"] = "1"
    proc = subprocess.Popen(['node', 'generator/index.js'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, env=env)
    proc.stdin.write(json.dumps({"style":"test"}).encode())
    proc.stdin.close()
    out = proc.stdout.read(44100*4)
    proc.wait()
    assert len(out) > 0
