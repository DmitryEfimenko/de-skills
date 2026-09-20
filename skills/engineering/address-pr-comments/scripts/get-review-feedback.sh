#!/usr/bin/env bash
# Fetches unresolved inline PR review threads and general PR conversation
# comments for the PR on the current branch, in one GraphQL round-trip.
#
# Outputs JSON: { reviewThreads: [...unresolved threads...], issueComments: [...] }
# reviewThreads[].comments.nodes[] and issueComments[] each have: author.login, body, url, createdAt
set -euo pipefail

OWNER=$(gh repo view --json owner -q .owner.login)
REPO=$(gh repo view --json name -q .name)
PR=$(gh pr view --json number -q .number)

QUERY='query($owner: String!, $repo: String!, $pr: Int!) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $pr) {
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
          isOutdated
          path
          line
          startLine
          comments(first: 100) {
            nodes { author { login } body url createdAt }
          }
        }
      }
      comments(first: 100) {
        nodes { id author { login } body url createdAt }
      }
    }
  }
}'

gh api graphql -f query="$QUERY" -f owner="$OWNER" -f repo="$REPO" -F pr="$PR" \
  --jq '{
    reviewThreads: [.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)],
    issueComments: .data.repository.pullRequest.comments.nodes
  }'
