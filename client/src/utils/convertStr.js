export const fixVietnameseEncoding = (str) => {
  try {
    if (!str) return str;
    
    // Method 1: Try TextDecoder for proper UTF-8 decoding
    if (str.includes('Ã') || str.includes('â') || str.includes('º')) {
      try {
        const bytes = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++) {
          bytes[i] = str.charCodeAt(i);
        }
        const decoder = new TextDecoder('utf-8');
        const decoded = decoder.decode(bytes);
        if (decoded.includes('Quản') || decoded.includes('việc') || !decoded.includes('Ã')) {
          return decoded;
        }
      } catch (error) {
        console.warn('TextDecoder failed:', error);
      }
    }
    
    // Method 2: Manual replacement for Vietnamese patterns
    if (str.includes('Ã') && (str.includes('â') || str.includes('º') || str.includes('¡'))) {
      return str
        // Common Vietnamese words patterns
        .replace(/Quáº£n/g, 'Quản')
        .replace(/lÃ½/g, 'lý')
        .replace(/cÃ´ng/g, 'công')
        .replace(/viá»\x87c/g, 'việc')
        .replace(/viá»c/g, 'việc')
        .replace(/cÃ¡/g, 'cá')
        .replace(/nhÃ¢n/g, 'nhân')
        
        // More Vietnamese words (add as needed)
        .replace(/báº£ng/g, 'bảng')
        .replace(/tÃ i/g, 'tài')
        .replace(/liá»u/g, 'liệu')
        .replace(/ngÆ°á»i/g, 'người')
        .replace(/phÃ¢n/g, 'phân')
        .replace(/tÃ­ch/g, 'tích')
        .replace(/há»c/g, 'học')
        .replace(/sinh/g, 'sinh')
        .replace(/giÃ¡o/g, 'giáo')
        .replace(/viÃªn/g, 'viên')
        .replace(/thá»i/g, 'thời')
        .replace(/gian/g, 'gian')
        .replace(/khÃ³a/g, 'khóa')
        .replace(/há»\x8dc/g, 'học')
        .replace(/bÃ i/g, 'bài')
        .replace(/táº­p/g, 'tập')
        .replace(/kiá»m/g, 'kiểm')
        .replace(/tra/g, 'tra')
        .replace(/báº£o/g, 'bảo')
        .replace(/cáº£o/g, 'cảo')
        .replace(/Äá»\x93/g, 'Đồ')
        .replace(/Ãn/g, 'án')
        .replace(/má»n/g, 'môn')
        .replace(/há»\x8di/g, 'hội')
        .replace(/tháº£o/g, 'thảo')
        .replace(/luáº­n/g, 'luận')
        .replace(/Äá»\x93/g, 'đồ')
        .replace(/á»\x89n/g, 'ứng')
        .replace(/dá»¥ng/g, 'dụng')
        .replace(/phá»¥/g, 'phụ')
        .replace(/lá»¥c/g, 'lục')
        .replace(/Äiá»u/g, 'điều')
        .replace(/khiá»n/g, 'khiển')
        .replace(/xá»­/g, 'xử')
        .replace(/lÃ½/g, 'lý')
        .replace(/thuyáº¿t/g, 'thuyết')
        .replace(/ká»¹/g, 'kỹ')
        .replace(/thuáº­t/g, 'thuật')
        .replace(/lá»p/g, 'lớp')
        .replace(/há»\x8dc/g, 'học')
        .replace(/má»i/g, 'mới')
        .replace(/cÅ©/g, 'cũ')
        .replace(/nÄm/g, 'năm')
        .replace(/tháº¿/g, 'thế')
        .replace(/ká»·/g, 'kỷ')
        .replace(/thá»\x9di/g, 'thời')
        .replace(/Äáº¡i/g, 'đại')
        
        // Basic Vietnamese diacritics
        .replace(/Ã¡/g, 'á').replace(/Ã /g, 'à').replace(/Ã¢/g, 'â')
        .replace(/Ã£/g, 'ã').replace(/Ã¨/g, 'è').replace(/Ã©/g, 'é')
        .replace(/Ãª/g, 'ê').replace(/Ã­/g, 'í').replace(/Ã¬/g, 'ì')
        .replace(/Ã³/g, 'ó').replace(/Ã²/g, 'ò').replace(/Ã´/g, 'ô')
        .replace(/Ã¹/g, 'ù').replace(/Ãº/g, 'ú').replace(/Ã½/g, 'ý')
        .replace(/Ä\u0091/g, 'đ').replace(/Ä\u0090/g, 'Đ')
        
        // Extended Vietnamese characters
        .replace(/á»/g, 'ố').replace(/á»\x93/g, 'ồ').replace(/á»\x91/g, 'ổ')
        .replace(/á»\x95/g, 'ỗ').replace(/á»\x97/g, 'ợ').replace(/Æ°/g, 'ư')
        .replace(/á»\x9b/g, 'ờ').replace(/á»\x9d/g, 'ở').replace(/á»\x9f/g, 'ỡ')
        .replace(/á»¡/g, 'ợ').replace(/á»£/g, 'ụ').replace(/á»¥/g, 'ủ')
        .replace(/á»§/g, 'ũ').replace(/á»©/g, 'ứ').replace(/á»«/g, 'ừ')
        .replace(/á»­/g, 'ử').replace(/á»¯/g, 'ữ').replace(/á»±/g, 'ự')
        .replace(/á»³/g, 'ỳ').replace(/á»µ/g, 'ỵ').replace(/á»·/g, 'ỷ')
        .replace(/á»¹/g, 'ỹ');
    }
    
    // Method 3: URL decoding
    if (str.includes('%')) {
      try {
        return decodeURIComponent(str);
      } catch (error) {
        console.warn('URL decode failed:', error);
      }
    }
    
    return str;
  } catch (error) {
    console.warn('Error fixing encoding:', error);
    return str;
  }
};

