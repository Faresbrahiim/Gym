package com.gym.membershipservice.api.exception;

/**
 * Simple exception for 404 resources.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}