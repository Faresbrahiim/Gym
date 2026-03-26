package com.gym.membershipservice.application.port.out;


import com.gym.membershipservice.application.entity.Subscription;

import java.util.List;
import java.util.UUID;

public interface SubscriptionService {

    List<Subscription> getUserSubscriptions(UUID userId);
}