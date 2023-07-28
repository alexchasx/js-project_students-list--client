(() => {
  const LEARNING_YEARS_COUNT = 4;
  const MIN_studyStart = 2000;
  const NEW_COURSE_MONTH = 8;

  const createFioCell = studentObj => {
    const nameTd = document.createElement('td');
    nameTd.textContent = studentObj.surname + ' ' + studentObj.name + ' ' + studentObj.lastname;
    return nameTd;
  };

  const createFacultyCell = studentObj => {
    const facultyTd = document.createElement('td');
    facultyTd.textContent = studentObj.faculty;
    return facultyTd;
  };

  const createBirthdayCell = studentObj => {
    const birthday = new Date(studentObj.birthday);
    const yearCount = new Date().getFullYear() - birthday.getFullYear();
    const birthdayStr = birthday.toLocaleDateString().split('/').join('.');
    const birthdayTd = document.createElement('td');
    birthdayTd.textContent = birthdayStr + ' (' + yearCount + ' лет)';
    return birthdayTd;
  };

  const createLearningYearsCell = studentObj => {
    const learningYearsTd = document.createElement('td');
    const courseNumber = new Date().getFullYear() - studentObj.studyStart + 1;
    let courseString = '(' + courseNumber + ' курс)';
    if ((courseNumber === 4 && new Date().getMonth() > NEW_COURSE_MONTH) || courseNumber > LEARNING_YEARS_COUNT) {
      courseString = '\"закончил\"';
    }
    learningYearsTd.textContent = `${studentObj.studyStart}-${+studentObj.studyStart
      + LEARNING_YEARS_COUNT} ${courseString}`;
    return learningYearsTd;
  };

  const validate = data => {
    const errorText = [];
    for (const [fieldName, value] of Object.entries(data)) {
      if (!value) {
        const labelText = document.querySelector('[for=' + fieldName + ']').textContent;
        errorText.push('Не заполнено поле: ' + labelText);
      }
      if (fieldName === 'birthday') {
        const minDate = new Date('01.01.1900');
        if (value < minDate || value > Date.now()) {
          errorText.push('Дата рождения должна находиться в диапазоне от 01.01.1900 до текущей даты');
        }
      } else if (fieldName === 'studyStart') {
        if (value && (value < MIN_studyStart || value > new Date().getFullYear())) {
          errorText.push('Год начала обучения должен находится в диапазоне от 2000-го до текущего года');
        }
      }
    }
    return errorText;
  };

  const clearErrors = () => {
    const oldErrors = document.querySelectorAll('.alert');
    if (oldErrors) {
      for (const oldError of oldErrors) {
        oldError.remove();
      }
    }
  };

  const renderErrors = errorText => {
    if (errorText.length) {
      for (const message of errorText) {
        const errorMessage = document.createElement('div');
        errorMessage.classList.add('alert', 'alert-danger');
        errorMessage.textContent = message;

        const button = document.querySelector('.form-button');
        button.before(errorMessage);
      }
    }
  };

  const storeStudent = async studentObj => {
    const response = await fetch('http://localhost:3000/api/students', {
      method: 'POST',
      body: JSON.stringify({
        name: studentObj.name,
        surname: studentObj.surname,
        lastname: studentObj.lastname,
        birthday: studentObj.birthday,
        studyStart: studentObj.studyStart,
        faculty: studentObj.faculty,
      }),
      headers: {
        'Content-Type': 'application/json',
      }
    });
    if (response.ok) {
      return true;
    }
    return false;
  };

  const createStudent = form => {
    const newStudent = {
      name: form.querySelector('#name').value.trim(),
      surname: form.querySelector('#surname').value.trim(),
      lastname: form.querySelector('#lastname').value.trim(),
      birthday: form.querySelector('#birthday').valueAsDate,
      studyStart: form.querySelector('#studyStart').value,
      faculty: form.querySelector('#faculty').value.trim(),
    };

    clearErrors();
    const errorMessages = validate(newStudent);
    if (errorMessages.length) {
      renderErrors(errorMessages);
      return false;
    } else {
      return storeStudent(newStudent);
    }
  };

  const sortArr = (arr, prop, dir = false) =>
    arr.sort((a, b) => (!dir ? a[prop] < b[prop] : a[prop] > b[prop]) ? -1 : 0);

  const deleteStudent = id => {
    fetch('http://localhost:3000/api/students/' + id, {
      method: 'DELETE',
    });
  }

  const createDeleteButton = (tr, id) => {
    const deleteButton = document.createElement('td');
    deleteButton.classList.add('bg-danger');
    deleteButton.setAttribute('role', 'button');
    deleteButton.textContent = 'Удалить';

    deleteButton.addEventListener('click', () => {
      if (!confirm('Вы уверены?')) {
        return;
      }
      tr.remove();
      deleteStudent(id);
    });
    return deleteButton;
  };

  const getStudentItem = studentObj => {
    const tr = document.createElement('tr');
    tr.append(
      createFioCell(studentObj),
      createFacultyCell(studentObj),
      createBirthdayCell(studentObj),
      createLearningYearsCell(studentObj),
      createDeleteButton(tr, studentObj.id),
    );
    return tr;
  };

  const renderStudentsTable = studentsArray => {
    const tbody = document.querySelector('#app');
    tbody.innerHTML = "";
    for (const student of studentsArray) {
      tbody.append(getStudentItem(student));
    }
  };

  const formHandler = () => {
    const form = document.querySelector('.form');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (createStudent(form)) {
        renderStudentsTable(await getStudents());
      }
    });
  };

  const sortStudents = studentsList => {
    document.querySelector('.fio-th').addEventListener('click', () => {
      sortArr(studentsList, 'lastname');
      sortArr(studentsList, 'name');
      sortArr(studentsList, 'surname');
      renderStudentsTable(studentsList);
    });

    document.querySelector('.faculty-th').addEventListener('click', () => {
      sortArr(studentsList, 'faculty');
      renderStudentsTable(studentsList);
    });

    document.querySelector('.birthday-th').addEventListener('click', () => {
      sortArr(studentsList, 'birthday');
      renderStudentsTable(studentsList);
    });

    document.querySelector('.start-year-th').addEventListener('click', () => {
      sortArr(studentsList, 'studyStart');
      renderStudentsTable(studentsList);
    });
  };

  const filter = studentsList => {
    const formFilter = document.querySelector('.filters-form');

    formFilter.addEventListener('submit', e => {
      e.preventDefault();
      const fioValue = formFilter.querySelector('#filter-fio').value.trim();
      const facultyValue = formFilter.querySelector('#filter-faculty').value.trim();
      const startYearValue = formFilter.querySelector('#filter-start-year').value.trim();
      const endYearValue = formFilter.querySelector('#filter-end-year').value.trim();

      let filteredList = studentsList;
      if (fioValue || facultyValue || startYearValue || endYearValue) {
        filteredList = studentsList.filter((obj) => {
          let checkFio = checkFaculty = checkStartYear = checkEndYear = true;
          if (fioValue) {
            checkFio = (obj.surname + obj.name + obj.lastname).includes(fioValue);
          }
          if (facultyValue) {
            checkFaculty = obj.faculty.includes(facultyValue)
          }
          if (startYearValue) {
            checkStartYear = obj.studyStart === +startYearValue;
          }
          if (endYearValue) {
            checkEndYear = (obj.studyStart + LEARNING_YEARS_COUNT) === +endYearValue;
          }
          return checkFio && checkFaculty && checkStartYear && checkEndYear;
        });
      }
      renderStudentsTable(filteredList);
    });
  };

  const erorr = (status) => {
    const table = document.querySelector('.students-list__table');
    const messageElement = document.createElement('div');
    messageElement.classList.add('alert', 'alert-warning');
    messageElement.textContent = 'Статус: ' + status;
    table.after(messageElement);
  };

  const getStudents = async () => {
    const response = await fetch('http://localhost:3000/api/students');
    if (response.ok) {
      const studentsList = await response.json();
      if (studentsList.length === 0) {
        erorr('404 (Ничего не найдено)');
      }
      return studentsList;
    }
    return null;
  };

  const createList = async () => {
    formHandler();

    const studentsList = await getStudents();
    if (studentsList && studentsList.length) {
      sortStudents(studentsList);
      renderStudentsTable(studentsList);
      filter(studentsList);
    }
  };

  window.createList = createList;
})();
