package com.gym.gym_booking.specification;

import com.gym.gym_booking.entity.GymClass;
import com.gym.gym_booking.enums.GymClassStatus;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

public final class GymClassSpecification {

    private GymClassSpecification() {
    }


    public static Specification<GymClass> hasClassType(
            Long classTypeId
    ) {
        return (root, query, cb) -> {

            if (classTypeId == null) {
                return null;
            }

            return cb.equal(
                    root.get("classType").get("id"),
                    classTypeId
            );
        };
    }


    public static Specification<GymClass> hasTrainer(
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


    public static Specification<GymClass> hasRoom(
            Long roomId
    ) {
        return (root, query, cb) -> {

            if (roomId == null) {
                return null;
            }

            return cb.equal(
                    root.get("room").get("id"),
                    roomId
            );
        };
    }


    public static Specification<GymClass> hasStatus(
            GymClassStatus status
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


    public static Specification<GymClass> startTimeFrom(
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


    public static Specification<GymClass> endTimeTo(
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


    public static Specification<GymClass> titleContains(
            String keyword
    ) {
        return (root, query, cb) -> {

            if (keyword == null || keyword.isBlank()) {
                return null;
            }

            return cb.like(
                    cb.lower(root.get("title")),
                    "%" + keyword.trim().toLowerCase() + "%"
            );
        };
    }


    public static Specification<GymClass> hasPublicStatus() {
        return (root, query, cb) ->
                root.get("status").in(
                        GymClassStatus.SCHEDULED,
                        GymClassStatus.FULL
                );
    }
}