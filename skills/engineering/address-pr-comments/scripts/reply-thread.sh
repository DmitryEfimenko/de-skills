#!/usr/bin/env bash
# Replies to an inline PR review thread, optionally resolving it.
#
# Usage: reply-thread.sh <thread_id> <body-file> [--resolve]
set -euo pipefail

THREAD_ID="$1"
BODY_FILE="$2"
RESOLVE="${3:-}"

REPLY_QUERY='mutation($threadId: ID!, $body: String!) {
  addPullRequestReviewThreadReply(input: { pullRequestReviewThreadId: $threadId, body: $body }) {
    comment { url }
  }
}'

gh api graphql -f query="$REPLY_QUERY" -f threadId="$THREAD_ID" -F body="@$BODY_FILE" \
  --jq '.data.addPullRequestReviewThreadReply.comment.url'

if [ "$RESOLVE" = "--resolve" ]; then
  RESOLVE_QUERY='mutation($threadId: ID!) {
    resolveReviewThread(input: { threadId: $threadId }) {
      thread { isResolved }
    }
  }'
  gh api graphql -f query="$RESOLVE_QUERY" -f threadId="$THREAD_ID" \
    --jq '"resolved: " + (.data.resolveReviewThread.thread.isResolved | tostring)'
fi
