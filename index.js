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
    // Результат: сброс:
    function _markResultDefault(result) {
        if (result.status !== 'default') {
            result.el.classList.remove('success');
            result.el.classList.remove('error');
            result.el.classList.remove('progress');
            result.status = 'default';
            result.el.innerText = '';
        }
    }
    // Результат: успех:
    function _markResultSuccess(result) {
        if (result.status !== 'success') {
            result.el.classList.add('success');
            result.el.classList.remove('error');
            result.el.classList.remove('progress');
            result.status = 'success';
        }
    }
    // Результат: ошибка:
    function _markResultError(result) {
        if (result.status !== 'error') {
            result.el.classList.remove('success');
            result.el.classList.add('error');
            result.el.classList.remove('progress');
            result.status = 'error';
        }
    }
    // Результат: исполнение:
    function _markResultProgress(result) {
        if (result.status !== 'progress') {
            result.el.classList.remove('success');
            result.el.classList.remove('error');
            result.el.classList.add('progress');
            result.status = 'progress';
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
        field.el = _private.form[fieldName];
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
        var RE = /^([A-Za-z0-9_\-\.])+\@([A-Za-z])+\.([A-Za-z]{2,3})$/;
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
        var RE = /^\+7\(([0-9]{3})\)([0-9]{3})\-([0-9]{2})\-([0-9]{2})$/;
        if (RE.test(el.value)) {
            return el.value.replace(/[^0-9]/gim,'').split('')
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
    _private.result.handle = function(responseJSON) {
        var response = JSON.parse(responseJSON);
        switch (response.status) {
            case 'success':
                _markResultSuccess(_private.result);
                _private.result.el.innerText = 'Success';
                break;
            case 'progress':
                _markResultProgress(_private.result);
                _private.result.el.innerText = '';
                setTimeout(function() {
                    _private.runAJAX();
                }, response.timeout);
                break;
            case 'error':
                _markResultError(_private.result);
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
        }
    };

    // ## Обработка отправки формы ##
    _private.form.addEventListener('submit', function(event) {
        event.preventDefault();
        module.submit();
    });

    return module;
})(document);
