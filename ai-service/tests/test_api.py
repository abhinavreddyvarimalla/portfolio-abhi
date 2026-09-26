import pytest
from fastapi.testclient import TestClient
from langchain_core.runnables import RunnableLambda
import app as api
from workflow import build_graph


@pytest.fixture
def client(monkeypatch):
    api.requests_by_client.clear()
    def unavailable(_):
        raise RuntimeError('Sensitive upstream information')
    monkeypatch.setattr(api, 'graph', build_graph(RunnableLambda(unavailable)))
    with TestClient(api.app) as client:
        yield client


def test_retrieval_endpoint_runs_without_ollama(client):
    response = client.post('/api/ai/ask', json={'question':'Go retries', 'mode':'retrieval'})
    assert response.status_code == 200
    body = response.json()
    assert body['status'] == 'retrieval_only'
    assert body['model'] is None
    assert body['sources'][0]['id'] == 'S2'
    assert body['trace'][0]['node'] == 'retrieve'


@pytest.mark.parametrize('body', [
    {'question':' '}, {'question':'x'*601}, {'question':'Go', 'limit':0},
    {'question':'Go', 'limit':5}, {'question':'Go', 'mode':'fake'},
])
def test_invalid_requests(client, body):
    assert client.post('/api/ai/ask', json=body).status_code == 422


def test_model_failure_is_explicit_not_a_fake_answer(client):
    response = client.post('/api/ai/ask', json={'question':'Go retries'})
    assert response.status_code == 503
    assert 'Sensitive' not in response.text
    assert 'claims' not in response.json()


def test_request_rate_limit(client):
    for _ in range(10):
        assert client.post('/api/ai/ask', json={'question':'Go', 'mode':'retrieval'}).status_code == 200
    assert client.post('/api/ai/ask', json={'question':'Go'}).status_code == 429


def test_oversize_body(client):
    assert client.post('/api/ai/ask', content=b'x'*9000).status_code == 413
