const fs = require('fs');
const path = require('path');

const rawDataPath = path.resolve(__dirname, 'dvhcvn/json/data.json');
const outputPath = path.resolve(__dirname, '../src/data/vn-locations.ts');

if (!fs.existsSync(rawDataPath)) {
  console.error("Không tìm thấy file data.json!");
  process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

// Cấu trúc mong muốn:
// export interface Ward { id: string; name: string; }
// export interface Province { id: string; name: string; wards: Ward[]; }
// export const VN_LOCATIONS: Province[] = [...];

const locations = rawData.map(p => {
  return {
    id: p.province_code,
    name: p.name,
    wards: (p.wards || []).map(w => ({
      id: w.ward_code,
      name: w.name
    }))
  };
});

const tsContent = `export interface Ward {
  id: string;
  name: string;
}

export interface Province {
  id: string;
  name: string;
  wards: Ward[];
}

export const VN_LOCATIONS: Province[] = ${JSON.stringify(locations, null, 2)};
`;

fs.writeFileSync(outputPath, tsContent, 'utf8');
console.log("Đã chuyển đổi thành công sang vn-locations.ts!");
