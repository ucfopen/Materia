from rest_framework.pagination import PageNumberPagination


class PageNumberWithTotalPagination(PageNumberPagination):
    def get_paginated_response(self, data):
        response = super().get_paginated_response(data)

        # Add in total number of pages
        response.data["total_pages"] = self.page.paginator.num_pages

        # Replace next/prev links with numbers. Makes it easier to use with useInfiniteQuery in React Query
        response.data["next"] = self.page.next_page_number() if self.page.has_next() else None
        response.data["previous"] = self.page.previous_page_number() if self.page.has_previous() else None

        return response
