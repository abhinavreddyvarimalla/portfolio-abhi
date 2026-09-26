import asyncio
import pytest
from langchain_core.runnables import RunnableLambda
from workflow import build_graph, Draft, Claim, PortfolioRetriever


def run(question='Go webhook retries', mode='model', draft=None):
    calls = []
    def fake(inputs):
        calls.append(inputs)
        return draft or Draft(claims=[Claim(text='The Go project uses retries.', source_ids=['S2'])])
    result = asyncio.run(build_graph(RunnableLambda(fake)).ainvoke(
        {'question': question, 'mode': mode, 'limit': 3, 'trace': []}))
    return result, calls


@pytest.mark.parametrize('question,expected', [
    ('How does the Go project handle failures?', 'S2'),
    ('What AI projects has Abhinav built?', 'S3'),
    ('What is his Java and Spring experience?', 'S4'),
    ('Where did he study college?', 'S5'),
    ('How does this portfolio use LangChain and LangGraph?', 'S6'),
])
def test_retrieval_examples(question, expected):
    assert PortfolioRetriever(limit=1).invoke(question)[0].metadata['id'] == expected


def test_full_graph_preserves_evidence_and_citations():
    result, calls = run()
    assert result['status'] == 'answered'
    assert [s['node'] for s in result['trace']] == ['retrieve', 'generate', 'check_references']
    assert result['claims'][0]['source_ids'] == ['S2']
    assert '[S2]' in calls[0]['context']


def test_no_evidence_skips_model():
    result, calls = run('banana spaceship xylophone')
    assert result['status'] == 'insufficient_evidence'
    assert calls == []
    assert [s['node'] for s in result['trace']] == ['retrieve', 'abstain']


def test_retrieval_mode_never_calls_model():
    result, calls = run(mode='retrieval')
    assert result['status'] == 'retrieval_only'
    assert not result['claims']
    assert calls == []


def test_unknown_citation_withholds_entire_answer():
    result, _ = run(draft=Draft(claims=[Claim(text='Invented.', source_ids=['S99'])]))
    assert result['status'] == 'citation_rejected'
    assert result['claims'] == []


def test_known_but_not_retrieved_citation_is_rejected():
    result, _ = run(draft=Draft(claims=[Claim(text='Education claim.', source_ids=['S5'])]))
    assert result['status'] == 'citation_rejected'


def test_model_abstention_has_no_claims():
    result, _ = run(draft=Draft(insufficient_evidence=True))
    assert result['status'] == 'insufficient_evidence'
    assert result['claims'] == []


def test_citation_validation_does_not_claim_semantic_verification():
    # A valid ID is not proof that a claim follows from the source.
    result, _ = run(draft=Draft(claims=[Claim(text='Unproven claim.', source_ids=['S2'])]))
    assert result['status'] == 'answered'
    assert 'not an automated fact check' in result['message']
