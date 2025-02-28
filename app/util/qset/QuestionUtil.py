from urllib.parse import unquote

from core.models import Question, MapQuestionToQset


class QuestionUtil:
    @staticmethod
    def get_users_question(user_id: int, q_type: str | None) -> list[dict]:
        # q_type is url encoded, so decode it and process it for DB use
        q_type = unquote(q_type) if q_type else ""

        raw_q_type_list = q_type.split(",")
        q_type_list = []
        for raw_q_type in raw_q_type_list:
            match raw_q_type:
                case "Question/Answer":
                    q_type_list.append("QA")
                    break
                case "Multiple Choice":
                    q_type_list.append("MC")
                    break
                case _:
                    break

        # TODO some caching stuff, see php

        # Get questions from DB
        question_query = Question.objects.filter(user_id=user_id)
        if len(q_type_list) > 0:  # Add type filter if type was specified
            question_query = question_query.filter(type__in=q_type_list)

        # Process each question
        results = []
        for question in question_query:
            # Get amount of uses for a question (how many qsets is it in)
            num_uses = MapQuestionToQset.objects.filter(question_id=question.id).count()

            results.append({
                "id": question.id,
                "type": question.type,
                "text": question.text,
                "uses": num_uses,
                "created_at": question.created_at,
            })

        # TODO do caching stuff, see php

        return results
