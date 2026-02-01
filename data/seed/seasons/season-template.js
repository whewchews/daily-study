module.exports = {
  seasonNumber: 1,
  name: '샘플 기수 이름',
  startDate: '2025-01-01',
  endDate: '2025-01-14',
  entryFee: 20000,
  status: 'COMPLETED', // UPCOMING | ACTIVE | COMPLETED
  isActive: false,
  problems: [
    {
      dayNumber: 1,
      title: '샘플 문제',
      url: 'https://example.com',
      assignedDate: '2025-01-01',
      problemType: 'REGULAR', // REGULAR | FREE | REST
      isPractice: false,
    },
  ],
}
