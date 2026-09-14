package com.gym.gym_booking.specification;

import com.gym.gym_booking.entity.TrainerTimeSlot;
import com.gym.gym_booking.enums.TimeSlotStatus;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

public final class TrainerTimeSlotSpecification {

    private TrainerTimeSlotSpecification() {
    }

    public static Specification<TrainerTimeSlot> hasTrainer(
            Long trainerId
    ) {
        return (root, query, cb) -> {

            if (trainerId == null) {
                return null;
            }

            return cb.equal(
                    root.get("trainer").get("id"),
                    trainerId
            );
        };
    }

    public static Specification<TrainerTimeSlot> hasStatus(
            TimeSlotStatus status
    ) {
        return (root, query, cb) -> {

            if (status == null) {
                return null;
            }

            return cb.equal(
                    root.get("status"),
                    status
            );
        };
    }

    public static Specification<TrainerTimeSlot> startTimeFrom(
            LocalDateTime from
    ) {
        return (root, query, cb) -> {

            if (from == null) {
                return null;
            }

            return cb.greaterThanOrEqualTo(
                    root.get("startTime"),
                    from
            );
        };
    }

    public static Specification<TrainerTimeSlot> endTimeTo(
            LocalDateTime to
    ) {
        return (root, query, cb) -> {

            if (to == null) {
                return null;
            }

            return cb.lessThanOrEqualTo(
                    root.get("endTime"),
                    to
            );
        };
    }
}