// Mock data for development

export interface Officer {
  id: string;
  name: string;
  rank: string;
  unit: string;
}

export interface AttendanceRecord {
  id: string;
  officerId: string;
  officerName: string;
  rank: string;
  checkInTime: string;
  distance: number;
  status: 'valid' | 'invalid' | 'on-mission';
  lat: number;
  lng: number;
}

export const MOCK_OFFICE_LOCATION = {
  lat: 10.8231,
  lng: 106.6297,
  name: "Công an tỉnh",
  address: "123 Đường Cách Mạng Tháng 8, TP. HCM"
};

export const MOCK_CURRENT_USER: Officer = {
  id: "1",
  name: "Nguyễn Văn An",
  rank: "Thượng úy",
  unit: "Phòng Cảnh sát Giao thông"
};

export const MOCK_ATTENDANCE_DATA: AttendanceRecord[] = [
  {
    id: "1",
    officerId: "1",
    officerName: "Nguyễn Văn An",
    rank: "Thượng úy",
    checkInTime: "2025-12-19T07:45:00",
    distance: 15,
    status: "valid",
    lat: 10.8232,
    lng: 106.6298
  },
  {
    id: "2",
    officerId: "2",
    officerName: "Trần Thị Bình",
    rank: "Đại úy",
    checkInTime: "2025-12-19T07:42:00",
    distance: 8,
    status: "valid",
    lat: 10.8231,
    lng: 106.6297
  },
  {
    id: "3",
    officerId: "3",
    officerName: "Lê Văn Cường",
    rank: "Thiếu úy",
    checkInTime: "2025-12-19T07:50:00",
    distance: 32,
    status: "valid",
    lat: 10.8234,
    lng: 106.6299
  },
  {
    id: "4",
    officerId: "4",
    officerName: "Phạm Minh Đức",
    rank: "Trung úy",
    checkInTime: "2025-12-19T07:38:00",
    distance: 125,
    status: "on-mission",
    lat: 10.8245,
    lng: 106.6310
  },
  {
    id: "5",
    officerId: "5",
    officerName: "Hoàng Thị Em",
    rank: "Thượng úy",
    checkInTime: "2025-12-19T07:55:00",
    distance: 22,
    status: "valid",
    lat: 10.8233,
    lng: 106.6296
  }
];

export const MOCK_STATS = {
  totalOfficers: 245,
  present: 198,
  absent: 12,
  onMission: 35
};
