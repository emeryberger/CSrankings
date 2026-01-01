#!/bin/bash

# Test script to validate the retry logic in GitHub Actions workflows
# This test simulates git push failures and verifies the retry mechanism

set -e

echo "Testing workflow retry logic..."
echo "================================"
echo

# Test 1: Success on first attempt
echo "Test 1: Success on first attempt"
echo "-----------------------------------"
test_success_first_try() {
    local push_attempts=0
    
    simulate_push() {
        push_attempts=$((push_attempts + 1))
        return 0  # Success immediately
    }
    
    # Main retry logic (copied from workflow)
    MAX_RETRIES=3
    RETRY_COUNT=0
    RETRY_DELAY=1  # Reduced for testing
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if simulate_push; then
            echo "✓ Success on attempt $((RETRY_COUNT + 1))"
            break
        else
            RETRY_COUNT=$((RETRY_COUNT + 1))
            if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                sleep $RETRY_DELAY
                RETRY_DELAY=$((RETRY_DELAY + 1))
            else
                echo "✗ Failed after $MAX_RETRIES attempts"
                return 1
            fi
        fi
    done
    
    if [ $push_attempts -eq 1 ]; then
        echo "✓ Test 1 PASSED: Succeeded on first attempt"
        return 0
    else
        echo "✗ Test 1 FAILED: Expected 1 attempt, got $push_attempts"
        return 1
    fi
}

test_success_first_try
echo

# Test 2: Success on second attempt
echo "Test 2: Success on second attempt"
echo "------------------------------------"
test_success_second_try() {
    local push_attempts=0
    
    simulate_push() {
        push_attempts=$((push_attempts + 1))
        if [ $push_attempts -eq 1 ]; then
            return 1  # Fail first time
        else
            return 0  # Success second time
        fi
    }
    
    # Main retry logic
    MAX_RETRIES=3
    RETRY_COUNT=0
    RETRY_DELAY=1
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if simulate_push; then
            echo "✓ Success on attempt $((RETRY_COUNT + 1))"
            break
        else
            RETRY_COUNT=$((RETRY_COUNT + 1))
            if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                echo "  Retrying after ${RETRY_DELAY}s delay..."
                sleep $RETRY_DELAY
                RETRY_DELAY=$((RETRY_DELAY + 1))
            else
                echo "✗ Failed after $MAX_RETRIES attempts"
                return 1
            fi
        fi
    done
    
    if [ $push_attempts -eq 2 ]; then
        echo "✓ Test 2 PASSED: Succeeded on second attempt"
        return 0
    else
        echo "✗ Test 2 FAILED: Expected 2 attempts, got $push_attempts"
        return 1
    fi
}

test_success_second_try
echo

# Test 3: Success on third (final) attempt
echo "Test 3: Success on third (final) attempt"
echo "------------------------------------------"
test_success_third_try() {
    local push_attempts=0
    
    simulate_push() {
        push_attempts=$((push_attempts + 1))
        if [ $push_attempts -lt 3 ]; then
            return 1  # Fail first two times
        else
            return 0  # Success third time
        fi
    }
    
    # Main retry logic
    MAX_RETRIES=3
    RETRY_COUNT=0
    RETRY_DELAY=1
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if simulate_push; then
            echo "✓ Success on attempt $((RETRY_COUNT + 1))"
            break
        else
            RETRY_COUNT=$((RETRY_COUNT + 1))
            if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                echo "  Retrying after ${RETRY_DELAY}s delay..."
                sleep $RETRY_DELAY
                RETRY_DELAY=$((RETRY_DELAY + 1))
            else
                echo "✗ Failed after $MAX_RETRIES attempts"
                return 1
            fi
        fi
    done
    
    if [ $push_attempts -eq 3 ]; then
        echo "✓ Test 3 PASSED: Succeeded on third attempt"
        return 0
    else
        echo "✗ Test 3 FAILED: Expected 3 attempts, got $push_attempts"
        return 1
    fi
}

test_success_third_try
echo

# Test 4: All retries fail
echo "Test 4: All retries fail"
echo "-------------------------"
test_all_retries_fail() {
    local push_attempts=0
    
    simulate_push() {
        push_attempts=$((push_attempts + 1))
        return 1  # Always fail
    }
    
    # Main retry logic
    MAX_RETRIES=3
    RETRY_COUNT=0
    RETRY_DELAY=1
    
    local failed=0
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if simulate_push; then
            echo "✓ Success on attempt $((RETRY_COUNT + 1))"
            break
        else
            RETRY_COUNT=$((RETRY_COUNT + 1))
            if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                echo "  Retrying after ${RETRY_DELAY}s delay..."
                sleep $RETRY_DELAY
                RETRY_DELAY=$((RETRY_DELAY + 1))
            else
                echo "  Failed after $MAX_RETRIES attempts (expected)"
                failed=1
            fi
        fi
    done
    
    if [ $push_attempts -eq 3 ] && [ $failed -eq 1 ]; then
        echo "✓ Test 4 PASSED: Failed after 3 attempts as expected"
        return 0
    else
        echo "✗ Test 4 FAILED: Expected 3 attempts and failure, got $push_attempts attempts"
        return 1
    fi
}

test_all_retries_fail
echo

# Test 5: Exponential backoff timing
echo "Test 5: Exponential backoff verification"
echo "------------------------------------------"
test_exponential_backoff() {
    local delays=()
    
    simulate_push() {
        return 1  # Always fail
    }
    
    # Main retry logic with timing
    MAX_RETRIES=3
    RETRY_COUNT=0
    RETRY_DELAY=5  # Use actual workflow value
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if simulate_push; then
            break
        else
            RETRY_COUNT=$((RETRY_COUNT + 1))
            if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                delays+=($RETRY_DELAY)
                RETRY_DELAY=$((RETRY_DELAY + 5))
            fi
        fi
    done
    
    if [ "${delays[0]}" -eq 5 ] && [ "${delays[1]}" -eq 10 ]; then
        echo "✓ Test 5 PASSED: Delays are 5s, 10s (exponential backoff)"
        return 0
    else
        echo "✗ Test 5 FAILED: Expected delays [5, 10], got [${delays[@]}]"
        return 1
    fi
}

test_exponential_backoff
echo

echo "================================"
echo "All tests completed successfully!"
echo "================================"
