function addDelegates() {
    const numberOfDelegates = document.getElementById('numberOfDelegates').value;
    const delegateRowsContainer = document.querySelector('.delegate-rows');
    // Remove existing delegate rows
    //delegateRowsContainer.innerHTML = '';
    const rowCount = delegateRowsContainer.getElementsByTagName('tr').length;
    // Add new delegate rows based on the number entered
    for (let i = 1; i <= numberOfDelegates; i++) {
        const delegateRow = document.createElement('tr');
        delegateRow.classList.add('delegate-row');
        delegateRow.innerHTML = `
                  <td>${rowCount + i}</td>
                  <td><input type="text" class="form-control" placeholder="Name" name="delegateName[]" required></td>
                  <td><select class="form-control" name="delegateGender[]" required>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  </td>
                  <td><input type="number" class="form-control" placeholder="Age" name="delegateAge[]" required></td>
                  <td><input type="checkbox" name="delegateBaptismStatus[]" checked></td>
              `;
        delegateRowsContainer.appendChild(delegateRow);
    }
}


document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('zoneSelect').addEventListener('change', function() {
        const selectedZone = this.value;

        // Check if selectedZone is empty before making the request
        if (selectedZone.trim() === '') {
            // Clear the churchSelect dropdown if selectedZone is empty
            const churchSelect = document.getElementById('churchSelect');
            churchSelect.innerHTML = '';

            // Add the initial "Please select" option
            const pleaseSelectOption = document.createElement('option');
            pleaseSelectOption.value = '';
            pleaseSelectOption.text = 'Please select';
            churchSelect.appendChild(pleaseSelectOption);

            // Optionally, you may want to handle other UI updates or feedback here
            console.error('Please select a valid zone.');
            return;
        }

        // Use Fetch API to make an AJAX request
        fetch(`/api/churches/${selectedZone}`)
            .then(response => response.json())
            .then(data => {
                const churchSelect = document.getElementById('churchSelect');
                churchSelect.innerHTML = '';

                // Populate church select options
                data.forEach(function(church) {
                    const option = document.createElement('option');
                    option.value = church.id;
                    option.text = church.name;
                    churchSelect.appendChild(option);
                });
            })
            .catch(error => console.error('Error:', error));
    });
});

function validateAndSubmit() {
    // Clear previous error messages
    clearErrors();

    // Perform form validation here
    var valid = validateForm();

    if (valid) {
        // If the form is valid, submit it
        submitForm();
    }
}




function submitForm() {
    // Clear previous error messages and marks
    clearErrors();

    fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(getFormData())
        })
        .then(response => response.json())
        .then(data => {
            sessionStorage.setItem('regCode', data.regCode);
            window.location.href = '/registered';
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function getSelectedEvents() {
    // Get the selected events from the checkboxes
    var checkboxes = document.querySelectorAll('input[name="events[]"]:checked');
    var selectedEvents = Array.from(checkboxes).map(checkbox => checkbox.value);

    return selectedEvents;
}



function validateForm() {
    // Perform validation for each required field
    var zone = document.getElementById('zoneSelect').value;
    var church = document.getElementById('churchSelect').value;
    var presidentName = document.getElementById('presidentName').value;
    var contactNumber = document.getElementById('contactNumber').value;

    var isValid = true;

    if (!zone) {
        showError('zoneSelect', 'Please select a zone');
        isValid = false;
    }

    if (!church) {
        showError('churchSelect', 'Please select a church location');
        isValid = false;
    }

    if (!presidentName) {
        showError('presidentName', 'Please enter the Youth President\'s name');
        isValid = false;
    }

    if (!contactNumber) {
        showError('contactNumber', 'Please enter a contact number');
        isValid = false;
    }

    // Validate the list of delegates
    var delegates = getDelegates();
    for (var i = 0; i < delegates.length; i++) {
        if (!validateDelegate(delegates[i])) {
            isValid = false;
        }
    }

    return isValid;
}

function validateDelegate(delegate) {
    // Perform validation for each delegate
    var name = delegate.name;
    var age = delegate.age;
    var gender = delegate.gender;
    var baptized = delegate.baptized;

    var isValid = true;

    if (!name || !age || !gender || baptized === undefined) {
        // Display error message and mark the corresponding row
        //showError('delegateName_' + delegate.index, 'Please fill in all delegate fields');
        isValid = false;
    }

    return isValid;
}

function showError(fieldId, errorMessage) {
    // Display error message and mark the field
    var field = document.getElementById(fieldId);
    try {
        field.classList.add('is-invalid');
    }
    catch(err) {
      console.log(err.message);
    }

    var errorContainer = document.createElement('div');
    errorContainer.className = 'invalid-feedback';
    errorContainer.innerHTML = errorMessage;

    field.parentNode.appendChild(errorContainer);
}

function clearErrors() {
    // Clear previous error messages and marks
    var invalidFields = document.querySelectorAll('.is-invalid');
    invalidFields.forEach(function(field) {
        field.classList.remove('is-invalid');
    });

    var errorMessages = document.querySelectorAll('.invalid-feedback');
    errorMessages.forEach(function(errorMessage) {
        errorMessage.parentNode.removeChild(errorMessage);
    });
}

function getDelegates() {
    // Get the list of delegates from the form
    var delegateRows = document.querySelectorAll('.delegate-row');
    var delegates = [];

    delegateRows.forEach(function(row, index) {
        var name = row.querySelector('input[name="delegateName[]"]').value;
        var age = row.querySelector('input[name="delegateAge[]"]').value;
        var gender = row.querySelector('select[name="delegateGender[]"]').value;
        var baptized = row.querySelector('input[name="delegateBaptismStatus[]"]').checked;

        delegates.push({
            name: name,
            age: age,
            gender: gender,
            baptized: baptized,
            index: index
        });
    });

    return delegates;
}

function getFormData() {
    var formData = {};

    formData.delegates = getDelegates();
    formData.events =  getSelectedEvents();
    formData.contactNumber = document.getElementById('contactNumber').value;
    formData.churchId =  document.getElementById('churchSelect').value;
    formData.presidentName = document.getElementById('presidentName').value;

    return formData;
}