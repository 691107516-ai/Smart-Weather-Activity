const provinceSelect = document.querySelector('#provinceSelect');
const checkBtn = document.querySelector('#checkBtn');
const loadingState = document.querySelector('#loadingState');
const errorState = document.querySelector('#errorState');
const emptyState = document.querySelector('#emptyState');
const resultCard = document.querySelector('#resultCard');

const provinceNames = {
  '13.7563,100.5018': 'กรุงเทพมหานคร',
  '18.7883,98.9853': 'เชียงใหม่',
  '16.4322,102.8236': 'ขอนแก่น',
  '13.3611,100.9847': 'ชลบุรี',
  '7.8804,98.3923': 'ภูเก็ต'
};

checkBtn.addEventListener('click', function () {
  const selectedValue = provinceSelect.value;

  // Validation
  if (!selectedValue) {
    alert('กรุณาเลือกจังหวัดก่อนกดตรวจสอบ');
    return;
  }

  fetchWeather(selectedValue);
});

async function fetchWeather(coordString) {
  const [latitude, longitude] = coordString.split(',');

  // แสดง Loading State, ซ่อนอันอื่น
  showState('loading');

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitude}` +
    `&longitude=${longitude}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m` +
    `&daily=precipitation_probability_max,uv_index_max` +
    `&timezone=Asia%2FBangkok` +
    `&forecast_days=1`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('API ตอบกลับผิดพลาด');
    }

    const data = await response.json();
    displayResult(data, provinceNames[coordString]);

  } catch (error) {
    console.error('Error:', error);
    showState('error');
  }
}

function displayResult(data, cityName) {
  const temp = data.current.temperature_2m;
  const humidity = data.current.relative_humidity_2m;
  const wind = data.current.wind_speed_10m;
  const rain = data.daily.precipitation_probability_max[0];
  const uv = data.daily.uv_index_max[0];

  document.querySelector('#cityName').textContent = cityName;
  document.querySelector('#checkTime').textContent =
    'ตรวจสอบเมื่อ: ' + new Date().toLocaleString('th-TH');
  document.querySelector('#temp').textContent = temp;
  document.querySelector('#humidity').textContent = humidity;
  document.querySelector('#wind').textContent = wind;
  document.querySelector('#rain').textContent = rain;
  document.querySelector('#uv').textContent = uv;

  document.querySelector('#recommendation').textContent = getRecommendation(temp, rain, uv, wind);

  showState('result');
}

function getRecommendation(temperature, rainProbability, uvIndex, windSpeed) {
  // เงื่อนไขคำแนะนำอย่างน้อย 4 ข้อ ตามที่โจทย์กหนด
  if (temperature >= 35) {
    return '🔥 อากาศร้อนมาก ควรหลีกเลี่ยงกิจกรรมกลางแจ้ง';
  } else if (rainProbability >= 60) {
    return '🌧️ มีโอกาสฝนตกสูง ควรพกร่มติดตัว';
  } else if (uvIndex >= 8) {
    return '☀️ ดัชนี UV สูงมาก ควรใช้ครีมกันแดดและสวมหมวก';
  } else if (windSpeed >= 30) {
    return '💨 ลมแรง ควรระวังกิจกรรมที่เกี่ยวกับของมีน้ำหนักเบา';
  } else {
    return '✅ สภาพอากาศเหมาะสหรับทำกิจกรรมกลางแจ้ง';
  }
}

function showState(state) {
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  emptyState.classList.add('hidden');
  resultCard.classList.add('hidden');

  if (state === 'loading') loadingState.classList.remove('hidden');
  if (state === 'error') errorState.classList.remove('hidden');
  if (state === 'empty') emptyState.classList.remove('hidden');
  if (state === 'result') resultCard.classList.remove('hidden');
}
