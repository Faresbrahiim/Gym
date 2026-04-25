namespace user_service.Application.DTOs
{
    public class PagedResponseDto<T>
    {
        public IReadOnlyList<T> Items { get; init; } = [];
        public int Page { get; init; }
        public int PageSize { get; init; }
        public int TotalItems { get; init; }
        public int TotalPages { get; init; }
        public bool HasNext { get; init; }
        public bool HasPrevious { get; init; }

        public static PagedResponseDto<T> Create(IEnumerable<T> items, int page, int pageSize, int totalItems)
        {
            var normalizedPageSize = pageSize <= 0 ? 1 : pageSize;
            var normalizedPage = page <= 0 ? 1 : page;
            var totalPages = totalItems <= 0 ? 0 : (int)Math.Ceiling(totalItems / (double)normalizedPageSize);

            return new PagedResponseDto<T>
            {
                Items = items.ToList(),
                Page = normalizedPage,
                PageSize = normalizedPageSize,
                TotalItems = totalItems,
                TotalPages = totalPages,
                HasNext = normalizedPage < totalPages,
                HasPrevious = normalizedPage > 1
            };
        }
    }
}
