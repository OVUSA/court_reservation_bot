aws scheduler create-schedule \
    --name MorningTennisBooking \
    --schedule-expression "at(2026-04-15T08:45:00)" \
    --schedule-expression-timezone "America/Chicago" \
    --target '{
        "Arn": "arn:aws:lambda:us-east-1:${}:function:${function}",
        "RoleArn": "arn:aws:iam::${}:role/service-role/${role}",
        "Input": "{\"action\": \"book_court\", \"chatId\": \"INSERT_YOUR_TELEGRAM_ID_HERE\"}"
    }' \
    --flexible-time-window '{ "Mode": "OFF" }' \
    --action-after-completion DELETE
