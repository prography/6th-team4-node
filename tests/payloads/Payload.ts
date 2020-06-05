// habit
export class Payload {
  public static habitOriginalPayloads = [
    {
      category: 'test',
      title: '습관빵 코딩',
      dayOfWeek: '0111000',
      alarmTime: '19:00:00',
    },
    {
      category: 'test',
      title: '파출소 출근하기',
      dayOfWeek: '1111111',
      alarmTime: '19:00:00',
    },
    {
      category: 'test',
      title: '프로그라피 노드 스터디하기',
      dayOfWeek: '0100000',
      alarmTime: '19:00:00',
    },
  ];

  public static habitUpdatePayloads = [
    {
      category: 'test',
      title: '습관빵 코딩',
      dayOfWeek: '0111000',
      alarmTime: '20:00:00',
    },
    {
      category: 'test',
      title: '파출소 출근하기',
      dayOfWeek: '1111111',
      alarmTime: '21:00:00',
    },
    {
      category: 'test',
      title: '프로그라피 노드 스터디하기',
      dayOfWeek: '0100000',
      alarmTime: '22:00:00',
    },
  ];

  public static habitGetPayloads(habitId: number) {
    return [
      {
        habitId: habitId,
        title: '습관빵 코딩',
        percent: 0,
      },
      {
        habitId: habitId + 1,
        title: '파출소 출근하기',
        percent: 0,
      },
      {
        habitId: habitId + 2,
        title: '프로그라피 노드 스터디하기',
        percent: 0,
      },
    ];
  }

  // Item
  public static ItemPayloads = [
    {
      name: '소보루빵',
      description: '소보루빵입니다.',
      level: 1,
      img: 'https://www.notion.so/2020-05-13-5-a3282a19d26c499fb96ca6a9edbf82e0#ad07fe1529e94f42a91c55ebb3c07a35',
    },
    {
      name: '식빵',
      description: '식빵입니다',
      level: 1,
      img: 'https://www.notion.so/2020-05-13-5-a3282a19d26c499fb96ca6a9edbf82e0#c2b586b1b7554112acec60059b98934f',
    },
    {
      name: '까눌레',
      description:
        '까눌레는 보르도 지방의 얼굴이라 할 수 있는 빵. 럼주의 달콤한 향과 귀여운 모양이 먹음직스럽다. 쫄깃하고 부드러운 식감을 자랑한다. 까눌레 전용 틀에 구워내는 데 잘 만들기가 굉장히 까다롭다고 한다!',
      level: 1,
      img: 'https://www.notion.so/2020-05-13-5-a3282a19d26c499fb96ca6a9edbf82e0#68eb730de311421d9d4fd289c06fa9c9',
    },
    {
      name: '마카롱',
      description:
        '겉은 바삭한 코크와 부드러운 필링이 쫀득하고 부드러워야 최고의 마카롱이라 말할 수 있다. 가끔 필링을 많이 넣은 가게는 뚱카롱이라고도 불린다.',
      level: 2,
      img: 'https://www.notion.so/2020-05-13-5-a3282a19d26c499fb96ca6a9edbf82e0#0cd36cad0b7b44d8bfa32906c259ee06',
    },
  ];

  // Ranking Payload Method
  public static RankingPayloads(userId: number) {
    return [
      {
        userId: userId + 1,
        userName: 'testUser1',
        exp: 10000,
        achievement: 10,
      },
      {
        userId: userId + 2,
        userName: 'testUser2',
        exp: 2500,
        achievement: 10,
      },
      {
        userId: userId + 3,
        userName: 'testUser3',
        exp: 5000,
        achievement: 40,
      },
      {
        userId: userId + 4,
        userName: 'testUser4',
        exp: 2500,
        achievement: 50,
      },
      {
        userId: userId + 5,
        userName: 'testUser5',
        exp: 500,
        achievement: 50,
      },
    ];
  }
}
