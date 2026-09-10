package com.gym.gym_booking.dto.gym_class;

import com.gym.gym_booking.enums.GymClassStatus;

import java.time.LocalDateTime;

public class GymClassResponseDTO {

    private Long id;

    private String title;

    private Integer maxCapacity;

    private Integer currentCount;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private GymClassStatus status;

    private Long classTypeId;
    private String classTypeName;

    private Long trainerId;
    private String trainerName;

    private Long roomId;
    private String roomName;

    public GymClassResponseDTO(
            Long id,
            String title,
            Integer maxCapacity,
            Integer currentCount,
            LocalDateTime startTime,
            LocalDateTime endTime,
            GymClassStatus status,
            Long classTypeId,
            String classTypeName,
            Long trainerId,
            String trainerName,
            Long roomId,
            String roomName
    ) {
        this.id = id;
        this.title = title;
        this.maxCapacity = maxCapacity;
        this.currentCount = currentCount;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
        this.classTypeId = classTypeId;
        this.classTypeName = classTypeName;
        this.trainerId = trainerId;
        this.trainerName = trainerName;
        this.roomId = roomId;
        this.roomName = roomName;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public Integer getMaxCapacity() {
        return maxCapacity;
    }

    public Integer getCurrentCount() {
        return currentCount;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public GymClassStatus getStatus() {
        return status;
    }

    public Long getClassTypeId() {
        return classTypeId;
    }

    public String getClassTypeName() {
        return classTypeName;
    }

    public Long getTrainerId() {
        return trainerId;
    }

    public String getTrainerName() {
        return trainerName;
    }

    public Long getRoomId() {
        return roomId;
    }

    public String getRoomName() {
        return roomName;
    }
}