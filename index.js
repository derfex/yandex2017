/**
 * Created by derfex on 17.08.2017.
 */
var MyForm = (function(d) {
    'use strict';
    // ## Вспомогательные функции ##
    // Создать пустую коллекцию (без __proto__):
    function _newCollection() { return Object.create(null); }
    // Проверить [[Class]] переменной:
    function _is(type, obj) {
        var _class = Object.prototype.toString.call(obj).slice(8, -1);
        return obj !== undefined && obj !== null && _class === type;
    }
    // Возвращает случайное число между min (включительно) и max (не включая max):
    function _getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }
    // Валидация: сброс:
    function _markFieldDefault(field) {
        if (field.status !== 'default') {
            field.el.classList.remove('error');
            field.status = 'default';
        }
    }
    // Валидация: ошибка:
    function _markFieldInvalid(field) {
        if (field.status !== 'invalid') {
            field.el.classList.add('error');
            field.status = 'invalid';
        }
    }



    // ## Коллекция с рабочими данными ##
    var _private = _newCollection();

    // ## Форма ##
    _private.form = _newCollection();
    _private.form.el = d.forms.myForm;
    _private.form.enabled = true;

    // ## Поля ##
    _private.field = _newCollection();
    ['fio', 'email', 'phone'].forEach(function(fieldName) {
        var field = _private.field[fieldName] = _newCollection();
        field.el = _private.form.el[fieldName];
        field.status = 'default';
    });
    // Ф. И. О.:
    _private.field.fio.validate = function() {
        var el = _private.field.fio.el;
        // Удалить крайние и повторяющиеся пробелы, сохранить результат для пользователя:
        el.value = el.value.trim().replace(/\s+/g, ' ');
        return el.value.split(' ').length === 3;
    };
    // E-mail:
    _private.field.email.ALLOW_DOMAIN = ['ya.ru', 'yandex.ru', 'yandex.ua', 'yandex.by', 'yandex.kz', 'yandex.com'];
    _private.field.email.validate = function() {
        var el = _private.field.email.el;
        // Удалить крайние пробелы, сохранить результат для пользователя:
        el.value = el.value.trim();
        // Корректный e-mail без субдомена и длинного имени домена первого уровня:
        var RE = /^([\w\-\.])+\@([A-Za-z])+\.([A-Za-z]{2,3})$/;
        if (RE.test(el.value)) {
            return !!~_private.field.email.ALLOW_DOMAIN.indexOf(el.value.split('@')[1]);
        }
        return false;
    };
    // Номер телефона:
    _private.field.phone.MAX_SUM = 30;
    _private.field.phone.validate = function() {
        var el = _private.field.phone.el;
        // Удалить крайние пробелы, сохранить результат для пользователя:
        el.value = el.value.trim();
        // Номер телефона в формате +7(999)999-99-99 (скобки и дефисы обязательны):
        var RE = /^\+7\((\d{3})\)(\d{3})\-(\d{2})\-(\d{2})$/;
        if (RE.test(el.value)) {
            return el.value.replace(/\D/g, '').split('')
                    .reduce(function(sum, currentNumber) {
                        return sum + +currentNumber;
                    }, 0) <= _private.field.phone.MAX_SUM;
        }
        return false;
    };

    // ## Результат ##
    _private.result = _newCollection();
    _private.result.el = d.getElementById('resultContainer');
    _private.result.status = 'default';
    _private.result.STATUS_LIST = ['success', 'progress', 'error'];
    _private.result.mark = function(requiredStatus) {
        if (!!~_private.result.STATUS_LIST.indexOf(requiredStatus)) {
            if (_private.result.status !== requiredStatus) {
                _private.result.STATUS_LIST.forEach(function(status) {
                    _private.result.el.classList[status !== requiredStatus ? 'remove' : 'add'](status);
                });
                _private.result.status = requiredStatus;
            }
        } else {
            if (_private.result.status !== 'default') {
                _private.result.STATUS_LIST.forEach(function(status) {
                    _private.result.el.classList.remove(status);
                });
                _private.result.status = 'default';
            }
        }
    };
    _private.result.handle = function(responseJSON) {
        var response = JSON.parse(responseJSON);
        _private.result.mark(response.status);
        switch (response.status) {
            case 'success':
                _private.result.el.innerText = 'Success';
                break;
            case 'progress':
                _private.result.el.innerText = '';
                setTimeout(_private.runAJAX, response.timeout);
                break;
            case 'error':
                _private.result.el.innerText = response.reason;
                break;
        }
    };


    // ## Выполнить AJAX-запрос ##
    _private.runAJAX = function() {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                _private.result.handle(this.responseText);
            }
        };
        // Положим, сервер чаще отдаёт статус 'progress', на втором месте 'success', в других случаях 'error':
        var random = _getRandomArbitrary(0, 10);
        var response = 'error';
        if (random > 7) {
            response = 'success';
        } else if (random > 2) {
            response = 'progress';
        }
        var url = 'resource/response/' + response + '.json';
        xhr.open('POST', url, false); // Блокируем асинхронность, чтобы не блокировать / разблокировать интерфейс.
        xhr.send(JSON.stringify(module.getData()));
    };


    // ## Глобальный объект ##
    var module = {};
    module.validate = function() {
        var result = {
            isValid: true,
            errorFields: []
        };
        for (var fieldName in _private.field) {
            var field = _private.field[fieldName];
            _markFieldDefault(field);
            if (!_private.field[fieldName].validate()) {
                result.errorFields.push(fieldName);
                result.isValid = false;
                _markFieldInvalid(field);
            }
        }
        return result;
    };
    module.getData = function() {
        var result = {};
        for (var fieldName in _private.field) {
            result[fieldName] = _private.field[fieldName].el.value;
        }
        return result;
    };
    module.setData = function(data) {
        if (!_is('Object', data)) return;
        for (var fieldName in _private.field) {
            var value = data[fieldName];
            if (_is('String', value) || _is('Number', value)) {
                _private.field[fieldName].el.value = value;
            }
        }
    };
    module.submit = function() {
        if (module.validate().isValid) {
            _private.runAJAX();
        } else {
            // Приводим элемент с результатом в исходное положение:
            _private.result.mark();
            _private.result.el.innerText = '';
        }
    };

    // ## Обработка отправки формы ##
    _private.form.el.addEventListener('submit', function(event) {
        event.preventDefault();
        module.submit();
    });

    return module;
})(document);
