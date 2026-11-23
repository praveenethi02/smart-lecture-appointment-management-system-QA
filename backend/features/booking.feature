Feature: Appointment booking
  As a student
  I want to book a lecturer's free consultation slot
  So that I can meet the lecturer

  Scenario: Student books an available slot
    Given lecturer "dr.kamal@apex.edu" has published a free slot
    And student "kasun@student.apex.edu" is logged in
    When the student books the slot with reason "Final year project review"
    Then the response status should be 201

  Scenario: Second student cannot book an already booked slot
    Given lecturer "dr.kamal@apex.edu" has published a free slot
    And student "kasun@student.apex.edu" has already booked the slot
    And student "dinithi@student.apex.edu" is logged in
    When the student books the slot with reason "Thesis discussion"
    Then the response status should be 409