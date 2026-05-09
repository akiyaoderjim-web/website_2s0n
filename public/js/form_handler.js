// form_handler.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('admissionContactForm');
    const formMessage = document.getElementById('form-message');

    const translations = {
        ru: {
            form_success_message: 'Ваше сообщение успешно отправлено!',
            form_error_message: 'Ошибка при отправке. Попробуйте позже.',
            form_cooldown_message: 'Пожалуйста, подождите 30 секунд перед повторной отправкой.'
        },
        uz: {
            form_success_message: 'Xabaringiz muvaffaqiyatli yuborildi!',
            form_error_message: 'Yuborishda xatolik. Keyinroq urinib ko\'ring.',
            form_cooldown_message: 'Iltimos, qayta yuborishdan oldin 30 soniya kuting.'
        },
        en: {
            form_success_message: 'Your message has been sent successfully!',
            form_error_message: 'An error occurred while sending the message.',
            form_cooldown_message: 'Please wait 30 seconds before submitting again.'
        }
    };

    const getLang = () => localStorage.getItem('selectedLang') || 'ru';

    let lastSubmitTime = 0;
    const SUBMIT_COOLDOWN = 30000;

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const now = Date.now();
            if (now - lastSubmitTime < SUBMIT_COOLDOWN) {
                formMessage.textContent = translations[getLang()].form_cooldown_message;
                formMessage.className = 'form-message error';
                formMessage.style.display = 'block';
                return;
            }

            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value.trim() || 'Не указано';
            });

            const message = `
📬 <b>Новое сообщение от абитуриента</b>

👨‍🎓 <b>ФИО:</b> ${escapeHtml(data.fullName)}
📧 <b>Email:</b> ${escapeHtml(data.email)}
📞 <b>Телефон:</b> ${escapeHtml(data.phone)}
💬 <b>Сообщение:</b>
${escapeHtml(data.message)}

⏱ <i>${new Date().toLocaleString('ru-RU')}</i>
            `.trim();

            lastSubmitTime = Date.now();

            const BOT_TOKEN = '7042630684:AAF4NocUZHIN70wvx3i2OhiQ6bKGtdjsQdM';
            const CHAT_IDS = ['-1002786023091', '1075491040'];
            const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

            formMessage.textContent = 'Отправка...';
            formMessage.className = 'form-message info';
            formMessage.style.display = 'block';

            try {
                const results = await Promise.all(
                    CHAT_IDS.map(chat_id =>
                        fetch(TELEGRAM_API_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                chat_id,
                                text: message,
                                parse_mode: 'HTML',
                                disable_web_page_preview: true
                            })
                        }).then(r => r.json())
                    )
                );

                const anyOk = results.some(r => r.ok);
                if (anyOk) {
                    formMessage.textContent = translations[getLang()].form_success_message;
                    formMessage.className = 'form-message success';
                    form.reset();
                } else {
                    console.error('Telegram API error:', results);
                    formMessage.textContent = translations[getLang()].form_error_message;
                    formMessage.className = 'form-message error';
                }
            } catch (error) {
                console.error('Fetch error:', error);
                formMessage.textContent = translations[getLang()].form_error_message;
                formMessage.className = 'form-message error';
            }

            setTimeout(() => {
                formMessage.style.display = 'none';
            }, 5000);
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
